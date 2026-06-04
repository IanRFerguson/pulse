#!/bin/bash

set -e

git checkout main
git pull origin main

echo "Restarting Raspberry Pi..."
docker compose down && docker compose up web-app --build -d