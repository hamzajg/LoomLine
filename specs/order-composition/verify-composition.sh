#!/bin/bash
# Live verification of the order composition API through real OIDC sessions.
set -e
API=http://localhost:8085
JP=/tmp/c-planner.jar; JS=/tmp/c-super.jar
rm -f $JP $JS
login() {
  local L=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" "$API/api/auth/login")
  curl -s -c $3 -b $3 "$L" -o /tmp/c-form.html
  local A=$(grep -o 'action="[^"]*"' /tmp/c-form.html | head -1 | sed 's/action="//;s/"$//;s/&amp;/\&/g')
  local CB=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" -X POST "$A" --data-urlencode "username=$1" --data-urlencode "password=$2")
  curl -s -c $3 -b $3 -o /dev/null "$CB"
}
putq() { curl -s -b $JP -X PUT -H 'Content-Type: application/json' -d "$2" "$API/api/orders/$1/quantities"; }
post() { curl -s -b $JP -X POST -H 'Content-Type: application/json' -d "$2" "$API/api/orders/$1"; }
login planner 'Demo!2026' $JP
login supervisor 'Demo!2026' $JS
NOIR=55555555-5555-4555-8555-555555555551; ECRU=55555555-5555-4555-8555-555555555552
S=66666666-6666-4666-8666-666666666661; M=66666666-6666-4666-8666-666666666662
ID=$(curl -s -b $JP -X POST -H 'Content-Type: application/json' -d '{"reference":"OF-CMP-'$(date +%s)'","clientId":"11111111-1111-4111-8111-111111111111","articleId":"33333333-3333-4333-8333-333333333333","quantity":100,"dueDate":"2026-12-15"}' $API/api/orders | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
echo "== pickers:"
curl -s -b $JP $API/api/colours | python3 -c "import json,sys;print('colours:',len(json.load(sys.stdin)))"
curl -s -b $JP $API/api/sizes | python3 -c "import json,sys;print('sizes:',len(json.load(sys.stdin)))"
echo "== set valid breakdown (40/30/30):"
putq $ID "{\"lines\":[{\"colourId\":\"$NOIR\",\"sizeId\":\"$S\",\"quantity\":40},{\"colourId\":\"$NOIR\",\"sizeId\":\"$M\",\"quantity\":30},{\"colourId\":\"$ECRU\",\"sizeId\":\"$M\",\"quantity\":30}]}" | python3 -c "import json,sys;print('lines:',len(json.load(sys.stdin)))"
echo "== exceeding total (reject):"
putq $ID "{\"lines\":[{\"colourId\":\"$NOIR\",\"sizeId\":\"$S\",\"quantity\":60},{\"colourId\":\"$NOIR\",\"sizeId\":\"$M\",\"quantity\":60}]}"
echo; echo "== unknown colour (reject):"
putq $ID "{\"lines\":[{\"colourId\":\"$(python3 -c 'import uuid;print(uuid.uuid4())')\",\"sizeId\":\"$S\",\"quantity\":10}]}"
echo; echo "== partial breakdown allowed (10):"
putq $ID "{\"lines\":[{\"colourId\":\"$NOIR\",\"sizeId\":\"$S\",\"quantity\":10}]}" | python3 -c "import json,sys;print('lines:',len(json.load(sys.stdin)))"
echo "== release then start:"
post $ID/transitions '{"to":"RELEASED"}' >/dev/null
post $ID/transitions '{"to":"IN_PROGRESS"}' >/dev/null
echo "== write on IN_PROGRESS (expect 409 COMPOSITION_LOCKED):"
putq $ID "{\"lines\":[{\"colourId\":\"$ECRU\",\"sizeId\":\"$S\",\"quantity\":100}]}"
echo; echo "== supervisor write (expect 403):"
curl -s -o /dev/null -w "%{http_code}\n" -b $JS -X PUT -H 'Content-Type: application/json' -d '{"lines":[]}' $API/api/orders/$ID/quantities
echo "== supervisor read (expect 200):"
curl -s -o /dev/null -w "%{http_code}\n" -b $JS $API/api/orders/$ID/quantities
