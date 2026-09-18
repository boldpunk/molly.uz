#!/bin/sh
# One-time migration (piped in over SSH by
# .github/workflows/migrate-nginx-body-size.yml): adds client_max_body_size
# to the already-running molly.uz nginx vhost. server-setup.sh now includes
# this for fresh installs, but this server was set up before that change, so
# it still has nginx's 1MB default — large photo uploads get a 413 before
# they ever reach the Next.js app.
set -eu

echo "=== adding client_max_body_size to nginx config (idempotent) ==="
if grep -q 'client_max_body_size' /etc/nginx/sites-available/molly.conf; then
  echo "directive already present, skipping"
else
  awk '
    /^server[[:space:]]*\{/ && !done {
      print
      print "    client_max_body_size 10m;"
      done = 1
      next
    }
    { print }
  ' /etc/nginx/sites-available/molly.conf > /etc/nginx/sites-available/molly.conf.new
  mv /etc/nginx/sites-available/molly.conf.new /etc/nginx/sites-available/molly.conf
  echo "inserted"
fi

echo "=== nginx config ==="
cat /etc/nginx/sites-available/molly.conf

nginx -t
systemctl reload nginx
echo "nginx reloaded"
