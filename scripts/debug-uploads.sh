#!/bin/sh
# One-off diagnostic for the broken /uploads/* 404s reported on molly.uz.
# Read-only — inspects the running container's uploads volume and recent
# logs, touches nothing.
set -eu

echo "=== docker compose ps ==="
cd /opt/molly-uz && docker compose ps

echo "=== container user ==="
docker compose exec -T web id

echo "=== /app/public/uploads ownership + contents ==="
docker compose exec -T web ls -la /app/public/uploads || true
docker compose exec -T web ls -la /app/public/uploads/products || true

echo "=== write test as the container's own user ==="
docker compose exec -T web sh -c 'touch /app/public/uploads/products/.write-test && echo OK && rm /app/public/uploads/products/.write-test' || echo "WRITE TEST FAILED"

echo "=== volume mount info ==="
docker volume inspect molly-uz_molly_uploads 2>/dev/null || docker volume ls | grep -i upload || true

echo "=== recent app logs (upload/error related) ==="
docker compose logs web --tail=300 2>&1 | grep -iE "upload|EACCES|EROFS|ENOENT|Error" | tail -80 || echo "no matching log lines"

echo "=== direct request to the app container, bypassing nginx ==="
curl -sS -D - -o /dev/null "http://127.0.0.1:3010/uploads/products/queen-grey-4-5b3d2e79eb4279bf.png" || true

echo "=== nginx config for molly.uz ==="
cat /etc/nginx/sites-available/molly.conf || true
