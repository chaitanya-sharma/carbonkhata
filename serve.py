import http.server
import socketserver
import os
import sys

DIRECTORY = os.path.abspath(os.path.dirname(__file__))
PORT = 8080

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        url_path = self.path.split('?')[0].split('#')[0]
        local_path = os.path.join(DIRECTORY, url_path.lstrip('/'))
        if not os.path.exists(local_path) and os.path.exists(local_path + '.html'):
            query = self.path[len(url_path):]
            self.path = url_path + '.html' + query
        return super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", port), CleanURLHandler) as httpd:
        print(f"Carbon Khata serving on http://0.0.0.0:{port}", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
