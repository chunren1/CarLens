#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> seed"
pnpm --filter @wangshu/api db:seed

echo "==> start api"
pnpm --filter @wangshu/api start > /tmp/wangshu-api-smoke.log 2>&1 &
API_PID=$!
trap 'kill $API_PID 2>/dev/null || true' EXIT

for i in $(seq 1 40); do
  if curl -sf http://127.0.0.1:3100/api/health > /tmp/wangshu-health.json; then
    break
  fi
  sleep 0.5
done

echo "health:"; cat /tmp/wangshu-health.json; echo
echo "models:"; curl -sf http://127.0.0.1:3100/api/models | head -c 400; echo
echo "quote:"
curl -sf -X POST http://127.0.0.1:3100/api/quote \
  -H 'content-type: application/json' \
  -d '{"modelSlug":"s7","trimId":1,"paintId":1,"wheelId":1,"interiorId":1,"packageIds":[]}' \
  | head -c 600; echo
echo "order:"
curl -sf -X POST http://127.0.0.1:3100/api/orders \
  -H 'content-type: application/json' \
  -d '{"modelSlug":"s7","trimId":1,"paintId":1,"wheelId":1,"interiorId":1,"packageIds":[],"customerName":"测试","phone":"13800138000","storeId":1}' \
  > /tmp/wangshu-order.json
cat /tmp/wangshu-order.json | head -c 400; echo
ORDER_NO=$(python3 -c "import json;print(json.load(open('/tmp/wangshu-order.json'))['orderNo'])")
echo "orderNo: $ORDER_NO"
echo "pay:"
curl -sf -X POST "http://127.0.0.1:3100/api/orders/$ORDER_NO/pay" | head -c 300; echo
echo "OK"
