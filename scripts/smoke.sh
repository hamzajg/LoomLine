#!/usr/bin/env bash
# End-to-end smoke test against a running LoomLine stack.
#
#   BASE_URL=http://localhost:8080 ./scripts/smoke.sh
#
# Exercises wave-1 behaviour only: health, reference data, create, read-back,
# duplicate rejection, and validation rejection.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8085}"
CLIENT_ID="${CLIENT_ID:-11111111-1111-4111-8111-111111111111}"
ARTICLE_ID="${ARTICLE_ID:-33333333-3333-4333-8333-333333333333}"
REFERENCE="SMOKE-$(date +%s)"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

echo "health"
curl -fsS "$BASE_URL/q/health/ready" >/dev/null || fail "health endpoint is not ready"

echo "reference data"
curl -fsS "$BASE_URL/api/clients" | grep -q "Maison Textile" || fail "seed clients missing"
curl -fsS "$BASE_URL/api/articles" | grep -q "ART-100" || fail "seed articles missing"

echo "create order $REFERENCE"
created=$(curl -fsS -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d "{\"reference\":\"$REFERENCE\",\"clientId\":\"$CLIENT_ID\",\"articleId\":\"$ARTICLE_ID\",\"quantity\":250,\"dueDate\":\"2026-12-15\"}")
echo "$created" | grep -q '"status":"DRAFT"' || fail "created order is not DRAFT: $created"

echo "read back by reference"
curl -fsS "$BASE_URL/api/orders/by-reference/$REFERENCE" | grep -q "$REFERENCE" \
  || fail "order cannot be read back"

echo "duplicate reference is rejected"
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d "{\"reference\":\"$REFERENCE\",\"clientId\":\"$CLIENT_ID\",\"articleId\":\"$ARTICLE_ID\",\"quantity\":10,\"dueDate\":\"2026-12-15\"}")
[ "$status" = "409" ] || fail "duplicate returned $status, expected 409"

echo "non-positive quantity is rejected"
body=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d "{\"reference\":\"$REFERENCE-2\",\"clientId\":\"$CLIENT_ID\",\"articleId\":\"$ARTICLE_ID\",\"quantity\":0,\"dueDate\":\"2026-12-15\"}")
echo "$body" | grep -q '"quantity"' || fail "quantity error missing: $body"

echo "OK"
