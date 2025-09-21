#!/usr/bin/env bash
set -e
# Create component product
COMP=$(curl -s -X POST http://localhost:4001/products -H "Content-Type:application/json" -d '{"sku":"C-1","name":"Bolt"}' | jq -r .id)
echo "Component: $COMP"
# Create finished good product
FG=$(curl -s -X POST http://localhost:4001/products -H "Content-Type:application/json" -d '{"sku":"FG-1","name":"Widget"}' | jq -r .id)
echo "Finished Good: $FG"
# Create BOM
curl -s -X POST http://localhost:4001/boms -H "Content-Type:application/json" -d "{\"productId\":\"$FG\",\"items\":[{\"componentProductId\":\"$COMP\",\"qtyPerUnit\":2,\"operationSequence\":1}]}" | jq
echo "Seed complete"
