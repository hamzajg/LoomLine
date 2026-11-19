#!/bin/bash
# Live verification of the article-catalogue API through real OIDC sessions.
set -e
API=http://localhost:8085
JP=/tmp/cat-planner.jar; JS=/tmp/cat-super.jar
rm -f $JP $JS
login() {
  local L=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" "$API/api/auth/login")
  curl -s -c $3 -b $3 "$L" -o /tmp/cat-form.html
  local A=$(grep -o 'action="[^"]*"' /tmp/cat-form.html | head -1 | sed 's/action="//;s/"$//;s/&amp;/\&/g')
  local CB=$(curl -s -c $3 -b $3 -o /dev/null -w "%{redirect_url}" -X POST "$A" --data-urlencode "username=$1" --data-urlencode "password=$2")
  curl -s -c $3 -b $3 -o /dev/null "$CB"
}
login planner 'Demo!2026' $JP
login supervisor 'Demo!2026' $JS
U=$(date +%s | tail -c 6)
CLIENT=11111111-1111-4111-8111-111111111111
ART=33333333-3333-4333-8333-333333333333
NOIR=55555555-5555-4555-8555-555555555551
S=66666666-6666-4666-8666-666666666661

echo "== planner creates a colour:"
COLOUR=$(curl -s -b $JP -H 'Content-Type: application/json' -d "{\"code\":\"V$U\",\"label\":\"Verify colour\"}" $API/api/colours)
echo "$COLOUR"
CID=$(echo "$COLOUR" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")

echo "== duplicate colour code, different case (expect 409 DUPLICATE):"
curl -s -b $JP -H 'Content-Type: application/json' -d "{\"code\":\"v$U\",\"label\":\"dup\"}" $API/api/colours

echo; echo "== planner creates an article:"
ARTL=$(curl -s -b $JP -H 'Content-Type: application/json' -d "{\"reference\":\"CAT-V$U\",\"label\":\"Verify article\",\"clientId\":\"$CLIENT\",\"sizeType\":\"Alpha\",\"unit\":\"pcs\"}" $API/api/articles)
echo "$ARTL"
AID=$(echo "$ARTL" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")

echo "== article with unknown client (expect 400 fieldErrors.clientId):"
curl -s -b $JP -H 'Content-Type: application/json' -d "{\"reference\":\"CAT-V${U}X\",\"label\":\"x\",\"clientId\":\"99999999-9999-4999-8999-999999999999\",\"unit\":\"pcs\"}" $API/api/articles

echo; echo "== article with unknown size type (expect 400 fieldErrors.sizeType):"
curl -s -b $JP -H 'Content-Type: application/json' -d "{\"reference\":\"CAT-V${U}Y\",\"label\":\"x\",\"clientId\":\"$CLIENT\",\"sizeType\":\"Gamma\",\"unit\":\"pcs\"}" $API/api/articles

echo; echo "== search articles q=verify (expect the new article):"
curl -s -b $JP "$API/api/articles?q=CAT-V$U" | python3 -c "import json,sys;d=json.load(sys.stdin);print('hits:',len(d),d[0]['reference'] if d else '-')"

echo "== update the article (unit -> dozen):"
curl -s -b $JP -X PUT -H 'Content-Type: application/json' -d "{\"reference\":\"CAT-V$U\",\"label\":\"Verify article\",\"clientId\":\"$CLIENT\",\"sizeType\":\"Alpha\",\"unit\":\"dozen\"}" $API/api/articles/$AID | python3 -c "import json,sys;print('unit:',json.load(sys.stdin)['unit'])"

echo "== order referencing the seeded article, then delete it (expect 409 IN_USE):"
OID=$(curl -s -b $JP -H 'Content-Type: application/json' -d "{\"reference\":\"OF-CAT-$U\",\"clientId\":\"$CLIENT\",\"articleId\":\"$ART\",\"quantity\":10,\"dueDate\":\"2026-12-15\"}" $API/api/orders | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
curl -s -o /dev/null -w '%{http_code} ' -b $JP -X DELETE $API/api/articles/$ART
curl -s -b $JP -X DELETE $API/api/articles/$ART

echo; echo "== order breakdown uses NOIR, then delete colour (expect 409 IN_USE):"
curl -s -b $JP -X PUT -H 'Content-Type: application/json' -d "{\"lines\":[{\"colourId\":\"$NOIR\",\"sizeId\":\"$S\",\"quantity\":10}]}" $API/api/orders/$OID/quantities >/dev/null
curl -s -b $JP -X DELETE $API/api/colours/$NOIR

echo; echo "== supervisor: reads ok, writes denied:"
curl -s -o /dev/null -w 'GET colours %{http_code}\n' -b $JS $API/api/colours
curl -s -o /dev/null -w 'POST colour %{http_code}\n' -b $JS -X POST -H 'Content-Type: application/json' -d '{"code":"X","label":"x"}' $API/api/colours

echo "== cleanup: delete verify article + colour =="
curl -s -o /dev/null -w 'article %{http_code}\n' -b $JP -X DELETE $API/api/articles/$AID
curl -s -o /dev/null -w 'colour %{http_code}\n' -b $JP -X DELETE $API/api/colours/$CID
