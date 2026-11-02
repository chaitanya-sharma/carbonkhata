import subprocess
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

js_test_code = r'''
const fs = require('fs');
const siteCode = fs.readFileSync('assets/site.js', 'utf8');
const appCode = fs.readFileSync('assets/app.js', 'utf8');

class Event {
  constructor(type, opts) {
    this.type = type;
    this.cancelable = opts && opts.cancelable;
    this.defaultPrevented = false;
  }
  preventDefault() { this.defaultPrevented = true; }
}

const listeners = {};
const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      dataset: {},
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        toggle: function(c, force) {
          if (force !== undefined) {
            if (force) this.classes.add(c); else this.classes.delete(c);
          } else {
            if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
          }
        },
        has: function(c) { return this.classes.has(c); }
      },
      style: {},
      setAttribute: (k, v) => {},
      getAttribute: () => '',
      addEventListener: function(evt, fn) { this['on' + evt] = fn; },
      dispatchEvent: function(evt) {
        if (this['on' + evt.type]) {
          this['on' + evt.type](evt);
          return !evt.defaultPrevented;
        }
        return true;
      },
      querySelectorAll: () => [],
      querySelector: () => ({ focus: () => {} }),
      scrollIntoView: () => {}
    };
  }
  return elements[id];
}

const mockDoc = {
  getElementById: getEl,
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { style: {} }
};

let currentHash = '#invalidRole';
const mockWindow = {
  addEventListener: (evt, fn) => { listeners[evt] = fn; },
  get location() { return { hash: currentHash }; },
  set location(val) { currentHash = (val && val.hash) ? val.hash : String(val); }
};

const vm = require('vm');
const ctx = {
  document: mockDoc,
  window: mockWindow,
  Event: Event,
  get location() { return mockWindow.location; },
  set location(val) { mockWindow.location = val; },
  clearTimeout: () => {},
  setTimeout: () => {},
  console: console,
  URL: { createObjectURL: () => 'blob:' },
  Blob: function() {}
};
vm.createContext(ctx);
vm.runInContext(siteCode, ctx);
vm.runInContext(appCode, ctx);

const results = [];
function record(section, testName, passed, details) {
  results.push({ section, testName, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${section} > ${testName}: ${details}`);
}

// -------------------------------------------------------------
// SECTION 1: ROUTING & HASH FALLBACK RESILIENCE
// -------------------------------------------------------------
// Initial load with #invalidRole
const role1 = elements['roleSel'].value;
const pass1 = (role1 === 'exporter');
record('ROUTER', 'Initial load with #invalidRole', pass1, `Fell back to role="${role1}", view="${elements['viewTitle'].textContent}"`);

// Hashchange to completely unknown role
currentHash = '#maliciousActor';
if (listeners['hashchange']) listeners['hashchange']();
const role2 = elements['roleSel'].value;
record('ROUTER', 'Hashchange to #maliciousActor', role2 === 'exporter', `State preserved valid role="${role2}" without exception`);

// Hashchange to valid role with invalid view
currentHash = '#mill/secretFinancials';
if (listeners['hashchange']) listeners['hashchange']();
const role3 = elements['roleSel'].value;
const view3 = elements['viewTitle'].textContent;
record('ROUTER', 'Hashchange to #mill/secretFinancials (invalid view)', role3 === 'mill' && view3 === 'Reports', `Role changed to "${role3}", view safely defaulted to "${view3}"`);

// Hashchange to empty hash "#"
currentHash = '#';
if (listeners['hashchange']) listeners['hashchange']();
const role4 = elements['roleSel'].value;
record('ROUTER', 'Hashchange to empty hash "#"', role4 === 'mill', `Retained safe role="${role4}"`);

// Direct API call: CK_DEMO.go('bogusRole')
ctx.window.CK_DEMO.go('bogusRole');
const role5 = elements['roleSel'].value;
record('ROUTER', 'Programmatic go("bogusRole")', role5 === 'mill', `Did not crash; preserved role="${role5}"`);

// Programmatic switch to stockist/lots for sales tests
ctx.window.CK_DEMO.go('stockist', 'lots');
record('ROUTER', 'go("stockist", "lots")', elements['roleSel'].value === 'stockist', `Successfully navigated to role="${elements['roleSel'].value}", view="${elements['viewTitle'].textContent}"`);

// -------------------------------------------------------------
// SECTION 2: SALE FORM INPUT BOUNDARY CONDITIONS
// -------------------------------------------------------------
// Lot ST-7781 starts with 100t, 40+35=75 sold, left=25t.
// Test 2A: tons = 0
getEl('tons').value = '0';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg2A = getEl('saleMsg').innerHTML;
record('FORM_INPUTS', 'tons = 0', msg2A.includes('Enter tonnes above zero'), `Rendered error: "${msg2A}"`);

// Test 2B: tons = -10 (negative)
getEl('tons').value = '-10';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg2B = getEl('saleMsg').innerHTML;
record('FORM_INPUTS', 'tons = -10 (negative)', msg2B.includes('Enter tonnes above zero'), `Blocked negative value; message="${msg2B}"`);

// Test 2C: tons = "abc" (non-numeric string)
getEl('tons').value = 'abc';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg2C = getEl('saleMsg').innerHTML;
record('FORM_INPUTS', 'tons = "abc" (string)', msg2C.includes('Enter tonnes above zero'), `NaN safely trapped; message="${msg2C}"`);

// Test 2D: tons = "" (empty string)
getEl('tons').value = '';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg2D = getEl('saleMsg').innerHTML;
record('FORM_INPUTS', 'tons = "" (empty)', msg2D.includes('Enter tonnes above zero'), `Empty trapped; message="${msg2D}"`);

// Test 2E: Decimal input 14.4 -> rounds to 14
getEl('tons').value = '14.4';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const toast2E = getEl('toast').textContent;
record('FORM_INPUTS', 'tons = 14.4 (decimal rounds down)', toast2E.startsWith('14 t recorded'), `Toast confirmed: "${toast2E}" (25 - 14 = 11t left)`);

// Test 2F: Decimal input 5.6 -> rounds to 6
getEl('tons').value = '5.6';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const toast2F = getEl('toast').textContent;
record('FORM_INPUTS', 'tons = 5.6 (decimal rounds up)', toast2F.startsWith('6 t recorded'), `Toast confirmed: "${toast2F}" (11 - 6 = 5t left)`);

// Test 2G: Exact remaining sale: 5t remaining, sell 5t
getEl('tons').value = '5';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const toast2G = getEl('toast').textContent;
record('FORM_INPUTS', 'tons = 5 (exact remaining 5t)', toast2G.startsWith('5 t recorded'), `Toast confirmed: "${toast2G}". Lot ST-7781 now has exactly 0 tonnes left.`);

// -------------------------------------------------------------
// SECTION 3: MASS-BALANCE GUARD ON FULLY DEPLETED LOT (left === 0)
// -------------------------------------------------------------
// Attempt 3A: Attempt to sell 1 tonne when left = 0
getEl('tons').value = '1';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg3A = getEl('saleMsg').innerHTML;
const blocked3A = msg3A.includes('Blocked. Only 0 t of ST-7781 is left') && msg3A.includes('id="oversellAlert"');
record('MASS_BALANCE', 'Attempt 1t sale when left = 0', blocked3A, `Rendered elevated alert with id="oversellAlert": "${msg3A}"`);

// Attempt 3B: Attempt to sell 99 tonnes when left = 0
getEl('tons').value = '99';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg3B = getEl('saleMsg').innerHTML;
const blocked3B = msg3B.includes('Blocked. Only 0 t of ST-7781 is left');
record('MASS_BALANCE', 'Attempt 99t sale when left = 0', blocked3B, `Strictly blocked; alert verified.`);

// Attempt 3C: Attempt to sell 0 tonnes when left = 0
getEl('tons').value = '0';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg3C = getEl('saleMsg').innerHTML;
record('MASS_BALANCE', 'Attempt 0t sale when left = 0', msg3C.includes('Enter tonnes above zero'), `Pre-empted by positive tonnage guard: "${msg3C}"`);

// Attempt 3D: Attempt to sell negative tonnes when left = 0
getEl('tons').value = '-5';
getEl('saleForm').onsubmit({ preventDefault: () => {} });
const msg3D = getEl('saleMsg').innerHTML;
record('MASS_BALANCE', 'Attempt -5t sale when left = 0', msg3D.includes('Enter tonnes above zero'), `Pre-empted by positive tonnage guard: "${msg3D}"`);

// -------------------------------------------------------------
// SECTION 4: JUDGE DEMO AUTOMATED SCENARIOS
// -------------------------------------------------------------
// Scenario 1: Reset activeLot to ST-7781 in fresh context or test scenario 1 trigger
ctx.window.CK_DEMO.scenario1();
const msgS1 = getEl('saleMsg').innerHTML;
const toastS1 = getEl('toast').textContent;
record('JUDGE_SCENARIOS', 'Scenario 1 (Overselling Block)', msgS1.includes('MASS-BALANCE VIOLATION PREVENTED') && toastS1.includes('99t sale strictly blocked'), `Oversell alert triggered, toast="${toastS1}"`);

// Scenario 2: Shipment EU-2391 with WhatsApp receipt & Mill Heat
ctx.window.CK_DEMO.scenario2();
const toastS2 = getEl('toast').textContent;
const drawerOpen = (getEl('drawer').dataset.open === 'true');
const drawerContent = getEl('drawerBody').innerHTML;
const hasReceipt = drawerContent.includes('Punjab Fuels #INV-3200') && drawerContent.includes('Heat #<b>H-24K118</b>');
record('JUDGE_SCENARIOS', 'Scenario 2 (EU-2391 WhatsApp + Mill Heat)', drawerOpen && hasReceipt, `Drawer open=${drawerOpen}, toast="${toastS2}", Provenance & tags verified`);

// Scenario 3: Lender SIDBI Checklist
ctx.window.CK_DEMO.scenario3();
const toastS3 = getEl('toast').textContent;
const roleS3 = getEl('roleSel').value;
record('JUDGE_SCENARIOS', 'Scenario 3 (Lender SIDBI Green Loan)', roleS3 === 'lender' && toastS3.includes('unlocks green loan'), `Switched to role="${roleS3}", toast="${toastS3}"`);

const allPassed = results.every(r => r.passed);
console.log('\n========================================');
console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${results.filter(r=>r.passed).length} | FAILED: ${results.filter(r=>!r.passed).length}`);
console.log(`OVERALL VERDICT: ${allPassed ? 'ALL ADVERSARIAL CHALLENGES PASSED' : 'CHALLENGES FAILED'}`);
console.log('========================================');
if (!allPassed) process.exit(1);
'''

result = subprocess.run(['node', '-e', js_test_code], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)
sys.exit(result.returncode)
