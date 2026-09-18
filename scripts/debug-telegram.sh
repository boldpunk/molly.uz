#!/bin/sh
# One-off read-only diagnostic: why did postNewOrderCard silently fail for
# the request created around 2026-09-17T21:02 UTC?
set -eu

echo "=== container uptime ==="
docker inspect molly-uz-web-1 --format '{{.State.StartedAt}}'

echo "=== env vars present (names + lengths only, no values) ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
for v in TELEGRAM_BOT_TOKEN TELEGRAM_STAFF_CHAT_ID TELEGRAM_WEBHOOK_SECRET; do
  val=$(eval "printf \"%s\" \"\$$v\"")
  echo "$v length: ${#val}"
done
'

echo "=== full app logs, last 600 lines, filtered for telegram/error signals ==="
docker compose -f /opt/molly-uz/docker-compose.yml logs web --since 48h 2>&1 | grep -iE "telegram|Error|failed|ETIMEDOUT|ECONNREFUSED|fetch failed" | tail -150 || echo "no matching log lines"

echo "=== raw getWebhookInfo (safe, read-only, no token printed) ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
'
