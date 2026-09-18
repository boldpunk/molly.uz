#!/bin/sh
# One-off diagnostic (read-only + a harmless test POST): investigates why
# new requests created via the website (submitRequest, which defers
# postNewOrderCard via next/server's after()) never get a
# telegram_message_id, while everything else about the bot/group works.
set -eu

echo "=== container start command / how it's actually running ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c 'cat /proc/1/cmdline | tr "\0" " "; echo'
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c 'node -e "console.log(process.version)"'

echo
echo "=== recent app logs mentioning Telegram/order-card/after around request creation ==="
docker compose -f /opt/molly-uz/docker-compose.yml logs web --since 48h 2>&1 \
  | grep -iE "telegram|postNewOrderCard|order card|after\(\)" \
  | tail -100 || echo "no matching log lines"

echo
echo "=== live repro: hit the real /request page's server action indirectly is hard from here, ==="
echo "=== so instead check whether after() runs at all in this exact runtime by calling it ==="
echo "=== through a tiny inline Node script that mimics the same call shape. ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
node -e "
const { after } = require(\"next/server\");
console.log(\"after import ok:\", typeof after);
"
' || echo "could not even require next/server after — see error above"
