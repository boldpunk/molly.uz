#!/bin/sh
set -eu
echo "=== container mounts ==="
docker inspect molly-uz-web-1 --format '{{range .Mounts}}{{.Type}} {{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'

echo "=== write test through the running container ==="
cd /opt/molly-uz
docker compose exec -T web sh -c 'echo hi > /app/public/uploads/products/.mount-check'

echo "=== confirm it landed on the host bind-mount path ==="
cat /opt/molly-uz/uploads/products/.mount-check 2>&1 || echo "NOT FOUND on host bind-mount path"

echo "=== cleanup ==="
docker compose exec -T web sh -c 'rm -f /app/public/uploads/products/.mount-check'
