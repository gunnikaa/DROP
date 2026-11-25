#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
./test-algorithms-mac-linux.sh
java -cp backend/out AlgorithmBenchmarks
