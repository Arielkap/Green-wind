#!/usr/bin/env python3
"""
Pogodynka Wiatrowa - Local Server Bootstrapper
Uruchamia serwer na http://localhost:8000, co pozwala przeglądarce 
na odblokowanie API Geolokalizacji (GPS) bez certyfikatów SSL.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    # Zmień katalog roboczy na ten, w którym jest skrypt
    os.chdir(DIRECTORY)
    
    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
            print("=" * 60)
            print("🌀 POGODYNKA WIATROWA & DESZCZOWA - SERWER URUCHOMIONY!")
            print("=" * 60)
            print(f" Serwer działa pod adresem: http://localhost:{PORT}")
            print(" Dlaczego serwer? Przeglądarki wymagają bezpiecznego połączenia")
            print(" (HTTPS lub localhost), aby zezwolić na pobranie pozycji GPS.")
            print(" Otworzenie pliku bezpośrednio z dysku (file://) zablokuje GPS!")
            print("=" * 60)
            print(" Aby wyłączyć serwer, naciśnij: CTRL + C")
            print("=" * 60)
            
            # Automatyczne otwarcie w przeglądarce
            webbrowser.open(f"http://localhost:{PORT}")
            
            # Start serwowania
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n[-] Zamykanie serwera. Do zobaczenia przy kolejnym sztormie! 🌀")
        sys.exit(0)
    except Exception as e:
        print(f"\n[!] Wystąpił nieoczekiwany błąd: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
