#!/bin/sh
set -eu

echo "=== recent app logs mentioning uploads/sharp/pages errors ==="
docker compose -f /opt/molly-uz/docker-compose.yml logs web --since 48h 2>&1 \
  | grep -iE "sharp|uploads/pages|EACCES|EPERM|ENOENT|Unhandled|uploadPageImage|uploadImage" \
  | tail -150 || echo "no matching log lines"

echo
echo "=== host-side uploads dir layout + ownership ==="
ls -la /opt/molly-uz/uploads/ 2>&1 || echo "uploads dir missing"
ls -la /opt/molly-uz/uploads/pages/ 2>&1 || echo "uploads/pages missing"
ls -la /opt/molly-uz/uploads/products/ 2>&1 || echo "uploads/products missing"

echo
echo "=== container-side view of the same mount ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
echo "whoami: $(id)"
ls -la /app/public/uploads/ 2>&1 || echo "no /app/public/uploads"
ls -la /app/public/uploads/pages/ 2>&1 || echo "no /app/public/uploads/pages"
'

echo
echo "=== live repro: write + sharp-resize a tiny PNG as the container user, inside uploads/pages ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
node -e "
const fs = require(\"fs\");
const path = require(\"path\");
const sharp = require(\"sharp\");
const dir = \"/app/public/uploads/pages\";
const onePxPng = Buffer.from(\"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=\", \"base64\");
(async () => {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
    console.log(\"mkdir ok\");
    const resized = await sharp(onePxPng).rotate().resize({ width: 2400, height: 2400, fit: \"inside\", withoutEnlargement: true }).toBuffer();
    console.log(\"sharp resize ok, bytes:\", resized.length);
    const target = path.join(dir, \"debug-repro-\" + Date.now() + \".png\");
    await fs.promises.writeFile(target, resized);
    console.log(\"writeFile ok:\", target);
  } catch (e) {
    console.error(\"REPRO FAILED:\", e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
"
' || echo "repro command exited non-zero — see error above"
