#!/bin/sh
# One-time migration (piped in over SSH by
# .github/workflows/migrate-uploads-to-bind-mount.yml): moves product
# upload storage from a Docker named volume to a host bind mount at
# /opt/molly-uz/uploads, and adds an nginx location block that serves
# /uploads/ directly from disk instead of proxying it to the Next.js app.
#
# Why: the app's own image-optimizer/App Router route cache was caching
# a 404 for a freshly uploaded file if it got requested (as normal admin
# usage does, right after upload) before the write had settled — the
# cached not-found stuck around for up to 5 minutes even once the file
# existed. Serving straight from disk via nginx sidesteps that layer
# entirely. Deploying the matching docker-compose.yml change (named
# volume -> bind mount) is a separate step; this script only prepares
# the host side so no upload data is lost in between.
set -eu

echo "=== copying existing uploads from the named volume to the bind-mount dir ==="
mkdir -p /opt/molly-uz/uploads
if [ -d /var/lib/docker/volumes/molly-uz_molly_uploads/_data ]; then
  cp -an /var/lib/docker/volumes/molly-uz_molly_uploads/_data/. /opt/molly-uz/uploads/
else
  echo "named volume data dir not found, skipping copy (nothing to migrate)"
fi
chown -R 1001:65533 /opt/molly-uz/uploads
echo "uploads now at /opt/molly-uz/uploads:"
find /opt/molly-uz/uploads -type f | sort

echo "=== adding /uploads/ location block to nginx config (idempotent) ==="
if grep -q 'location /uploads/' /etc/nginx/sites-available/molly.conf; then
  echo "location block already present, skipping"
else
  awk '
    /^[[:space:]]*location \/ \{/ && !done {
      print "    location /uploads/ {"
      print "        alias /opt/molly-uz/uploads/;"
      print "        access_log off;"
      print "        expires 30d;"
      print "        add_header Cache-Control \"public, max-age=2592000, immutable\";"
      print "    }"
      print ""
      done = 1
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
