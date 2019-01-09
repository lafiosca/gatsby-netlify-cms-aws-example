#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"/..

node_modules/.bin/ts-node -P tsconfig.json --files src/util/create-user.ts

