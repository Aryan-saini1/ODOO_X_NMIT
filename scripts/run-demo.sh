#!/usr/bin/env bash
set -e
# creates MO, confirms it, and prints outbox rows for verification
FG_ID=$(curl -s http://localhost:4001/products | jq -r '.[0].id') # or change to known FG id from seed
if [ -z "$FG_ID" ] || [ "$FG_ID" == "null" ]; then
  echo "No product found. Run demo-seed.sh first."
  exit 1
fi
echo "Using FG product $FG_ID"
MO_JSON=$(curl -s -X POST http://localhost:4002/mo -H "Content-Type:application/json" -d "{\"productId\":\"$FG_ID\",\"quantity\":5}" )
echo "Created MO: $MO_JSON"
MO_ID=$(echo "$MO_JSON" | jq -r .id)
echo "MO ID: $MO_ID"
# confirm MO
CONF=$(curl -s -X PATCH http://localhost:4002/mo/$MO_ID/confirm)
echo "Confirm response: $CONF"
# Show outbox entries
psql -d modb -c "SELECT id, event_type, payload, created_at FROM outbox WHERE aggregate_type='MANUFACTURING_ORDER' ORDER BY created_at DESC LIMIT 10;"
