#!/usr/bin/env bash
# Wave 3 live verification against the Compose stack (api :8085, keycloak :8087).
set -u
API=http://localhost:8085
KC=http://localhost:8087
J=/tmp/w3
rm -f $J.*.jar
login() { # $1=user $2=pass $3=jar — full OIDC code flow, incl. VERIFY_PROFILE
  local L ACTION CB
  L=$(curl -s -c "$3" -b "$3" -o /dev/null -w "%{redirect_url}" "$API/api/auth/login")
  curl -s -c "$3" -b "$3" "$L" -o "$J.$1.html"
  ACTION=$(grep -o 'action="[^"]*"' "$J.$1.html" | head -1 | sed 's/action="//;s/"$//;s/&amp;/\&/g')
  CB=$(curl -s -c "$3" -b "$3" -o /dev/null -w "%{redirect_url}" -X POST "$ACTION" \
       --data-urlencode "username=$1" --data-urlencode "password=$2")
  if [[ "$CB" == *required-action* ]]; then
    curl -s -c "$3" -b "$3" "$CB" -o "$J.$1.v.html"
    local VA
    VA=$(grep -o 'action="[^"]*"' "$J.$1.v.html" | head -1 | sed 's/action="//;s/"$//;s/&amp;/\&/g')
    CB=$(curl -s -c "$3" -b "$3" -o /dev/null -w "%{redirect_url}" -X POST "$VA" \
         --data-urlencode "email=$1@loomline.local" --data-urlencode "firstName=$1" --data-urlencode "lastName=E2E")
  fi
  curl -s -c "$3" -b "$3" -o /dev/null "$CB"
}
TS=$(date +%s)
echo "=== anonymous ==="
curl -s -o /dev/null -w "GET /api/navigation (no session): %{http_code}\n" "$API/api/navigation"
login planner 'Demo!2026' $J.planner.jar
echo "=== planner (production-planner) ==="
curl -s -b $J.planner.jar $API/api/auth/session; echo
curl -s -b $J.planner.jar $API/api/navigation; echo
curl -s -o /dev/null -w "GET /api/orders: %{http_code}\n" -b $J.planner.jar $API/api/orders
curl -s -o /dev/null -w "GET /api/users: %{http_code}\n" -b $J.planner.jar $API/api/users
curl -s -o /dev/null -w "POST /api/orders: %{http_code}\n" -b $J.planner.jar -X POST $API/api/orders \
  -H 'Content-Type: application/json' -d "{\"reference\":\"OF-W3-$TS\",\"clientId\":\"11111111-1111-4111-8111-111111111111\",\"articleId\":\"33333333-3333-4333-8333-333333333333\",\"quantity\":1,\"dueDate\":\"2026-12-20\"}"
login supervisor 'Demo!2026' $J.supervisor.jar
echo "=== supervisor (production-supervisor) ==="
curl -s -b $J.supervisor.jar $API/api/navigation; echo
curl -s -o /dev/null -w "GET /api/orders: %{http_code}\n" -b $J.supervisor.jar $API/api/orders
curl -s -o /dev/null -w "POST /api/orders: %{http_code}\n" -b $J.supervisor.jar -X POST $API/api/orders \
  -H 'Content-Type: application/json' -d "{\"reference\":\"OF-W3-DENIED-$TS\",\"clientId\":\"11111111-1111-4111-8111-111111111111\",\"articleId\":\"33333333-3333-4333-8333-333333333333\",\"quantity\":1,\"dueDate\":\"2026-12-20\"}"
curl -s -b $J.supervisor.jar "$API/api/orders?reference=OF-W3-DENIED-$TS"; echo " <- denied order must be absent"
login admin 'ChangeMe!2026' $J.admin.jar
echo "=== admin (administrator) ==="
curl -s -b $J.admin.jar $API/api/roles; echo
curl -s -b $J.admin.jar -X POST $API/api/users -H 'Content-Type: application/json' \
  -d '{"username":"wave3e2e","email":"w3@loomline.local","password":"Demo!2026","role":"production-supervisor"}' -w "\nPOST /api/users: %{http_code}\n"
echo "=== admin-created user sign-in (US7 end-to-end) ==="
login wave3e2e 'Demo!2026' $J.new.jar
curl -s -b $J.new.jar $API/api/auth/session; echo
curl -s -b $J.new.jar $API/api/navigation; echo
curl -s -o /dev/null -w "POST /api/orders as wave3e2e: %{http_code}\n" -b $J.new.jar -X POST $API/api/orders \
  -H 'Content-Type: application/json' -d "{\"reference\":\"OF-W3-NEW-$TS\",\"clientId\":\"11111111-1111-4111-8111-111111111111\",\"articleId\":\"33333333-3333-4333-8333-333333333333\",\"quantity\":1,\"dueDate\":\"2026-12-20\"}"
# cleanup: delete the user through the Keycloak Admin API
AT=$(curl -s -X POST "$KC/realms/master/protocol/openid-connect/token" \
  -d 'grant_type=password&client_id=admin-cli&username=admin&password=admin' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])')
U=$(curl -s -H "Authorization: Bearer $AT" "$KC/admin/realms/loomline/users?username=wave3e2e" \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d[0]["id"] if d else "")')
[ -n "$U" ] && curl -s -X DELETE -H "Authorization: Bearer $AT" "$KC/admin/realms/loomline/users/$U" -o /dev/null -w "cleanup delete wave3e2e: %{http_code}\n"
