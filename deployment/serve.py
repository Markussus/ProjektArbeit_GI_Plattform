import http.server
import socketserver
import threading
import webbrowser
import os
import mimetypes


HOST = "127.0.0.1"
PORT = 8080

URL = f"http://{HOST}:{PORT}"


# Ensure WebAssembly gets the correct MIME type.
mimetypes.add_type("application/wasm", ".wasm")


class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        requested_path = self.translate_path(self.path)

        # Normal file / directory exists -> serve normally.
        if os.path.exists(requested_path):
            return super().do_GET()

        # Otherwise fall back to index.html for SPA routing.
        self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        # Avoid annoying caching issues when testing local releases.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def open_browser():
    webbrowser.open(URL)


def main():
    print()
    print("GI Training Center")
    print("==================")
    print()
    print(f"Running at: {URL}")
    print()
    print("The browser should open automatically.")
    print("Press Ctrl+C to stop the server.")
    print()

    threading.Timer(1.0, open_browser).start()

    try:
        with ReusableTCPServer(
            (HOST, PORT),
            SPARequestHandler
        ) as httpd:
            httpd.serve_forever()

    except KeyboardInterrupt:
        print()
        print("Server stopped.")

    except OSError as error:
        print()
        print("Could not start the server.")
        print(error)
        print()
        input("Press Enter to close...")


if __name__ == "__main__":
    main()