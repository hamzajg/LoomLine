#!/bin/bash
set -e
API=http://localhost:8085
JAR=/tmp/w3-planner.jar; SJAR=/tmp/w3-super.jar
rm -f $JAR $SJAR
login() { # $1=user $2=pass $3=jar
  local L=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" "$API/api/auth/login")
  curl -s -c $3 -b $3 "$L" -o /tmp/w3-form.html
  local A=$(grep -o 'action="[^"]*"' /tmp/w3-form.html | head -1 | sed 's/action="//;s/"$//;s/&amp;/\&/g')
  local CB=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" -X POST "$A" --data-urlencode "username=$1" --data-urlencode "password=$2")
  curl -s -c $3 -b $3 -o /dev/null "$CB"
}
login planner 'Demo!2026' $JAR
REF="OF-W3-$(date +%s)"
ID=$(curl -s -b $JAR -H 'Content-Type: application/json' -d "{\"reference\":\"$REF\",\"clientId\":\"11111111-1111-4111-8111-111111111111\",\"articleId\":\"33333333-3333-4333-8333-333333333333\",\"quantity\":10,\"dueDate\":\"2026-12-15\"}" $API/api/orders | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
echo "created $ID ($REF)"
for T in RELEASED IN_PROGRESS; do
  curl -s -b $JAR -H 'Content-Type: application/json' -d "{\"to\":\"$T\"}" $API/api/orders/$ID/transitions | python3 -c "import json,sys;d=json.load(sys.stdin);print('transition ->',d.get('status',d))"
done
# invalid: COMPLETED->IN_PROGRESS is terminal; test DRAFT->COMPLETED on a second order
ID2=$(curl -s -b $JAR -H 'Content-Type: application/json' -d "{\"reference\":\"$REF-B\",\"clientId\":\"11111111-1111-4111-8111-111111111111\",\"articleId\":\"33333333-3333-4333-8333-333333333333\",\"quantity\":5,\"dueDate\":\"2026-12-15\"}" $API/api/orders | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
echo "-- invalid DRAFT->COMPLETED:"; curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"COMPLETED"}' $API/api/orders/$ID2/transitions; echo
echo "-- cancel in progress w/o reason:"; curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"CANCELLED"}' $API/api/orders/$ID/transitions; echo
echo "-- cancel in progress with reason:"; curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"CANCELLED","reason":"customer request"}' $API/api/orders/$ID/transitions | python3 -c "import json,sys;print('status ->',json.load(sys.stdin)['status'])"
echo "-- history:"; curl -s -b $JAR $API/api/orders/$ID/history | python3 -m json.tool | head -30
echo "-- complete then terminal attempt:"
curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"COMPLETED"}' $API/api/orders/$ID2/transitions >/dev/null  # will fail (DRAFT->COMPLETED invalid); do proper path
curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"RELEASED"}' $API/api/orders/$ID2/transitions >/dev/null
curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"IN_PROGRESS"}' $API/api/orders/$ID2/transitions >/dev/null
curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"COMPLETED"}' $API/api/orders/$ID2/transitions | python3 -c "import json,sys;print('status ->',json.load(sys.stdin)['status'])"
echo "-- COMPLETED->CANCELLED (terminal):"; curl -s -b $JAR -H 'Content-Type: application/json' -d '{"to":"CANCELLED"}' $API/api/orders/$ID2/transitions; echo
# supervisor: view-only -> 403 on transition
login supervisor 'Demo!2026' $SJAR
echo "-- supervisor transition (expect 403):"; curl -s -o /dev/null -w "%{http_code}\n" -b $SJAR -H 'Content-Type: application/json' -d '{"to":"RELEASED"}' $API/api/orders/$ID2/transitions
