#!/usr/bin/env python3
"""
Simple HTTP server for testing the API client demo
Serves files with proper CORS headers for API integration
"""

import http.server
import socketserver
import os
from http.server import SimpleHTTPRequestHandler

class CORSHTTPRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with CORS headers."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to show cleaner logs."""
        print(f"{self.address_string()} - {format % args}")

def run_server(port=8080):
    """Run the development server."""
    Handler = CORSHTTPRequestHandler
    
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"""
╔════════════════════════════════════════════════╗
║       LocumTrueRate Frontend Demo Server       ║
╚════════════════════════════════════════════════╝

Server running at: http://localhost:{port}

Available demos:
- API Client Demo: http://localhost:{port}/api-client-demo.html

To test the API integration:
1. Make sure the backend is running (npm start)
2. Open the demo URL above in your browser
3. Test authentication and API calls

Press Ctrl+C to stop the server.
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            httpd.shutdown()

if __name__ == "__main__":
    import sys
    
    # Allow custom port
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    run_server(port)