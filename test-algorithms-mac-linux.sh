#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backend/out
find backend/src -name '*.java' > backend/sources.txt
javac -encoding UTF-8 -d backend/out @backend/sources.txt
javac -encoding UTF-8 -cp backend/out -d backend/out backend/test/AlgorithmTests.java backend/test/AlgorithmBenchmarks.java
java -ea -cp backend/out AlgorithmTests
