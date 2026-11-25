@echo off
setlocal
cd /d "%~dp0"
if not exist backend\out mkdir backend\out
dir /s /b backend\src\*.java > backend\sources.txt
javac -encoding UTF-8 -d backend\out @backend\sources.txt || exit /b 1
javac -encoding UTF-8 -cp backend\out -d backend\out backend\test\AlgorithmTests.java backend\test\AlgorithmBenchmarks.java backend\test\GeoapifyServiceTests.java || exit /b 1
java -ea -cp backend\out AlgorithmTests
java -ea -cp backend\out GeoapifyServiceTests
