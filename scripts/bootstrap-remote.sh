#!/bin/sh
# Runs ON the deploy server (piped in over SSH by
# .github/workflows/bootstrap-server.yml). Adds the CI deploy key and prints
# read-only diagnostics — installs nothing, changes nothing else.
set -eu

DEPLOY_PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAk3nMFgIVfrXHeGzV17Dui+xY6M6ZHtFx+CKVYljOSC molly-uz-deploy"

mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
if ! grep -qF "molly-uz-deploy" ~/.ssh/authorized_keys; then
  echo "$DEPLOY_PUBKEY" >> ~/.ssh/authorized_keys
fi
chmod 600 ~/.ssh/authorized_keys
echo "=== deploy key installed ==="

echo "=== docker ==="
which docker 2>&1 || echo "docker: not found"
docker --version 2>&1 || true
docker compose version 2>&1 || echo "docker compose: not found"

echo "=== listening ports ==="
ss -tlnp 2>&1 || netstat -tlnp 2>&1 || true

echo "=== nginx ==="
which nginx 2>&1 || echo "nginx: not found"
nginx -v 2>&1 || true
ls -la /etc/nginx/sites-enabled 2>&1 || true
ls -la /etc/nginx/conf.d 2>&1 || true

echo "=== caddy ==="
which caddy 2>&1 || echo "caddy: not found"

echo "=== certbot ==="
which certbot 2>&1 || echo "certbot: not found"
ls /etc/letsencrypt/live 2>&1 || true

echo "=== disk ==="
df -h / 2>&1 || true

echo "=== mebelflow-api service (read-only check, not modified) ==="
systemctl status mebelflow-api --no-pager 2>&1 | head -15 || true
