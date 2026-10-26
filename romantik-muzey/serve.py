# Node oʻrnatilmagan boʻlsa:  python3 serve.py   →  http://localhost:5173
import http.server, socketserver, webbrowser
PORT = 5173
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
with socketserver.TCPServer(("", PORT), H) as httpd:
    print(f"Muzey ochildi: http://localhost:{PORT}  (toʻxtatish: Ctrl+C)")
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()
