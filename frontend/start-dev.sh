#!/bin/bash
export PATH="$HOME/node-v22/bin:$PATH"
cd "$(dirname "$0")"
exec npm run dev
