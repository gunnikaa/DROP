@echo off
setlocal
cd /d "%~dp0"
call test-algorithms-windows.bat || exit /b 1
java -cp backend\out AlgorithmBenchmarks
