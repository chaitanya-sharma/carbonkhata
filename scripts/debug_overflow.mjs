import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME_PATH, ['--remote-debugging-port=9225', '--headless=new', '--disable-gpu', '--window-size=390,844']);

setTimeout(async () => {
  const targetRes = await fetch('http://127.0.0.1:9225/json/new?http://127.0.0.1:8080/calculator', { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Emulation.setDeviceMetricsOverride', params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } }));
  
  await new Promise(r => setTimeout(r, 1200));

  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const rootWidth = 390;
        const html = document.documentElement;
        return {
          clientWidth: html.clientWidth,
          scrollWidth: html.scrollWidth,
          hasOverflow: html.scrollWidth > html.clientWidth,
          overflowing: Array.from(document.querySelectorAll('*'))
            .filter(el => el.getBoundingClientRect().right > 390.5 || el.scrollWidth > 390.5)
            .map(el => ({ tag: el.tagName, id: el.id, class: el.className, right: Math.round(el.getBoundingClientRect().right), sw: el.scrollWidth }))
            .slice(0, 10)
        };
      })()`,
      returnByValue: true
    }
  }));

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id === 3) {
      console.log('Overflowing elements on calculator:', msg.result.result ? msg.result.result.value : msg);
      chrome.kill();
      process.exit(0);
    }
  };
}, 800);
