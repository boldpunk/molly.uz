#!/bin/sh
set -eu

echo "=== full sendMessage error, unfiltered context ==="
docker compose -f /opt/molly-uz/docker-compose.yml logs web --since 48h 2>&1 | grep -A 15 "Telegram API error" | tail -120 || echo "no matching log lines"

echo "=== getWebhookInfo, run from the HOST (container has no curl) ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
node -e "
fetch(\"https://api.telegram.org/bot\" + process.env.TELEGRAM_BOT_TOKEN + \"/getWebhookInfo\")
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j, null, 2)))
  .catch(e => console.error(\"fetch error:\", e.message));
"
'

echo "=== getChat on the configured staff chat id, to confirm the bot can still see it ==="
docker compose -f /opt/molly-uz/docker-compose.yml exec -T web sh -c '
node -e "
fetch(\"https://api.telegram.org/bot\" + process.env.TELEGRAM_BOT_TOKEN + \"/getChat?chat_id=\" + process.env.TELEGRAM_STAFF_CHAT_ID)
  .then(r => r.json())
  .then(j => console.log(JSON.stringify(j, null, 2)))
  .catch(e => console.error(\"fetch error:\", e.message));
"
'
