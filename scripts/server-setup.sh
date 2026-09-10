#!/bin/sh
# Runs ON the deploy server (piped in over SSH by
# .github/workflows/install-server.yml). One-time setup: installs Docker if
# missing, creates the app directory, and adds an Nginx server block for
# molly.uz alongside the existing mebelflow.uz config — never touches
# mebelflow.conf or the mebelflow-api service.
set -eu

echo "=== docker ==="
if ! command -v docker >/dev/null 2>&1; then
  echo "installing docker..."
  curl -fsSL https://get.docker.com | sh
else
  echo "docker already installed: $(docker --version)"
fi
systemctl enable --now docker

echo "=== app directory ==="
mkdir -p /opt/molly-uz
echo "/opt/molly-uz ready"

echo "=== nginx vhost for molly.uz ==="
cat > /etc/nginx/sites-available/molly.conf <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name molly.uz www.molly.uz;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/molly.conf /etc/nginx/sites-enabled/molly.conf
nginx -t
systemctl reload nginx
echo "nginx vhost for molly.uz installed and reloaded"

echo "=== mebelflow.conf untouched, check ==="
ls -la /etc/nginx/sites-enabled/
