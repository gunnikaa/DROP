@echo off
setlocal
cd /d "%~dp0"
if not exist backend\out mkdir backend\out
dir /s /b backend\src\*.java > backend\sources.txt
javac -encoding UTF-8 -d backend\out @backend\sources.txt
if errorlevel 1 exit /b 1
start "DROP Core Java Backend" /D "%CD%" java -cp backend\out com.drop.server.DropServer
if not exist node_modules call npm install
npm run dev
