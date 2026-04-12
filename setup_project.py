#!/usr/bin/env python3
# setup_project.py - Instala dependencias do CapRush
import subprocess,sys
def r(cmd):print('$',cmd);subprocess.run(cmd,shell=True,check=True)
print('=== CapRush Setup ===')
r(sys.executable+' -m pip install flask flask-cors')
print()
print('Pronto! Rode:')
print('  Terminal 1: cd server && python server.py')
print('  Terminal 2: cd client && python -m http.server 3000')
print('  Chrome: http://localhost:3000')
