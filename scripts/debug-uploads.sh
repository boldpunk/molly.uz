#!/bin/sh
# One-off diagnostic (v2) for persistent /uploads/* 404s on the Piola
# product photos. Read-only — inspects the running container's uploads
# volume and recent logs, touches nothing.
set -eu

echo "=== docker compose ps ==="
cd /opt/molly-uz && docker compose ps

echo "=== container start time / uptime ==="
docker inspect molly-uz-web-1 --format '{{.State.StartedAt}}'

echo "=== /app/public/uploads/products full listing ==="
docker compose exec -T web ls -la /app/public/uploads/products || true

echo "=== looking specifically for piola files ==="
docker compose exec -T web sh -c 'ls -la /app/public/uploads/products/ | grep -i piola' || echo "NO PIOLA FILES FOUND ON DISK"

echo "=== disk space on the volume ==="
docker compose exec -T web df -h /app/public/uploads || true
df -h /var/lib/docker/volumes/molly-uz_molly_uploads/_data || true

echo "=== app logs around recent uploads (last 500 lines, filtered) ==="
docker compose logs web --tail=500 2>&1 | grep -iE "upload|piola|EACCES|EROFS|ENOENT|EEXIST|Error|failed" | tail -150 || echo "no matching log lines"

echo "=== app logs, fully unfiltered tail (last 100 lines) ==="
docker compose logs web --tail=100 2>&1

echo "=== direct request to the app container, bypassing nginx ==="
curl -sS -D - -o /dev/null "http://127.0.0.1:3010/uploads/products/piola-4-13529b5e594742c6.png" || true
