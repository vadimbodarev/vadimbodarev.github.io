#!/usr/bin/env python3
"""
Server local în Python pentru rularea paginii interactive cu stolul de păsări (Murmuration).
Rulare: python3 app.py
"""
import http.server
import socketserver
import os

PORT = int(os.environ.get("PORT", 8000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serverul rulează la adresa: http://localhost:{PORT}")
        httpd.serve_forever()
