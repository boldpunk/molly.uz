#!/bin/sh
# Runs ON the deploy server (piped in over SSH by
# .github/workflows/setup-https.yml). Requests a Let's Encrypt cert for
# molly.uz via certbot's nginx plugin — reuses the existing certbot
# installation/account (already used for mebelflow.uz), only touches
# molly.conf.
set -eu

echo "=== certbot for molly.uz ==="
certbot --nginx -d molly.uz -d www.molly.uz \
  --non-interactive --agree-tos --redirect || \
certbot --nginx -d molly.uz -d www.molly.uz \
  --non-interactive --agree-tos --redirect \
  --register-unsafely-without-email

echo "=== nginx sites-enabled ==="
ls -la /etc/nginx/sites-enabled/

echo "=== nginx test + status ==="
nginx -t
systemctl status nginx --no-pager | head -5
