#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:$PATH"
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="${HOSTINGER_TOKEN_FILE:-$ROOT/.hostinger-token}"
DOMAIN="${HOSTINGER_DOMAIN:-yaavs-pospago.hostingersite.com}"
HUSER="${HOSTINGER_USER:-u376360150}"

if [[ -n "${HOSTINGER_API_TOKEN:-}" ]]; then
  TOKEN="$HOSTINGER_API_TOKEN"
elif [[ -f "$TOKEN_FILE" ]]; then
  TOKEN="$(tr -d '\n\r ' < "$TOKEN_FILE")"
else
  echo "Missing Hostinger token (.hostinger-token or HOSTINGER_API_TOKEN)" >&2
  exit 1
fi

CREDS=$(curl -sS --noproxy '*' -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "User-Agent: hostinger-api-mcp/1.45.4" \
  -d "{\"username\":\"$HUSER\",\"domain\":\"$DOMAIN\"}" \
  "https://developers.hostinger.com/api/hosting/v1/files/upload-urls")

printf '%s' "$CREDS" > /tmp/creds_pospago.json
URL=$(python3 -c 'import json;print(json.load(open("/tmp/creds_pospago.json"))["url"])')
AUTH=$(python3 -c 'import json;print(json.load(open("/tmp/creds_pospago.json"))["auth_key"])')
REST=$(python3 -c 'import json;print(json.load(open("/tmp/creds_pospago.json"))["rest_auth_key"])')
echo "creds_ok domain=$DOMAIN"

encode_path() {
  python3 -c 'import sys,urllib.parse; print("/".join(urllib.parse.quote(p, safe="") for p in sys.argv[1].split("/")))' "$1"
}

upload_one() {
  local local_file="$1" dest="$2" size code attempt enc
  size=$(wc -c < "$local_file" | tr -d ' ')
  enc="$(encode_path "$dest")"
  local upload_url="${URL}/${enc}?override=true"
  for attempt in 1 2 3 4 5; do
    code=$(curl -sS --noproxy '*' -k -o /tmp/tus_c_body -w "%{http_code}" -X POST \
      -H "X-Auth: $AUTH" -H "X-Auth-Rest: $REST" -H "Tus-Resumable: 1.0.0" \
      -H "Upload-Length: $size" -H "Upload-Offset: 0" -H "User-Agent: hostinger-api-mcp/1.45.4" \
      "$upload_url" || echo "000")
    [[ "$code" == "201" || "$code" == "200" || "$code" == "204" ]] && break
    sleep "$attempt"
  done
  for attempt in 1 2 3 4 5; do
    code=$(curl -sS --noproxy '*' -k -o /tmp/tus_p_body -w "%{http_code}" -X PATCH \
      -H "X-Auth: $AUTH" -H "X-Auth-Rest: $REST" -H "Tus-Resumable: 1.0.0" \
      -H "Content-Type: application/offset+octet-stream" -H "Upload-Offset: 0" \
      -H "User-Agent: hostinger-api-mcp/1.45.4" \
      --data-binary @"$local_file" "$upload_url" || echo "000")
    [[ "$code" == "204" || "$code" == "200" || "$code" == "201" ]] && return 0
    sleep "$attempt"
  done
  echo "FAIL $dest last=$code"
  return 1
}

OK=0
FAIL=0

# If args provided, upload only those relative paths
if [[ $# -gt 0 ]]; then
  for rel in "$@"; do
    if upload_one "$ROOT/$rel" "$rel"; then OK=$((OK+1)); echo "OK $rel"; else FAIL=$((FAIL+1)); fi
  done
else
  PRIORITY=(
    index.html premium.html simple.html lite.html
    css/styles.css css/stores.css
    js/header.js js/plans-catalog.js js/main.js
    js/pospago-stores.js js/premium-devices.js js/tiendas-att-stores.js js/device-deals.js
  )
  for rel in "${PRIORITY[@]}"; do
    [[ -f "$ROOT/$rel" ]] || continue
    if upload_one "$ROOT/$rel" "$rel"; then OK=$((OK+1)); echo "OK $rel"; else FAIL=$((FAIL+1)); fi
  done
  while IFS= read -r -d '' f; do
    rel="${f#$ROOT/}"
    skip=0
    for p in "${PRIORITY[@]}"; do [[ "$rel" == "$p" ]] && skip=1 && break; done
    [[ $skip -eq 1 ]] && continue
    case "$rel" in
      _tools/*|_refs/*|.git/*|*.mp4|*TEMP*|server.log|*.zip|.hostinger-token|scripts/*) continue ;;
    esac
    if upload_one "$f" "$rel"; then OK=$((OK+1)); echo "OK $rel"; else FAIL=$((FAIL+1)); fi
  done < <(find "$ROOT" \
    \( -path "$ROOT/_tools" -o -path "$ROOT/_refs" -o -path "$ROOT/.git" \) -prune -o \
    -type f ! -name '.DS_Store' ! -name '.gitignore' ! -name 'README.md' ! -name '.hostinger-token' -print0)
fi

echo "DONE ok=$OK fail=$FAIL"
BASE="https://$DOMAIN"
for path in "/" "/css/styles.css?v=20260905a" "/js/header.js?v=20260905a" "/premium.html" "/simple.html" "/lite.html"; do
  echo "check $(curl -s -o /dev/null -w "%{http_code}" "$BASE$path") $path"
done
curl -s "$BASE/" | python3 -c 'import sys,re; t=sys.stdin.read(); print("has_submenu", "nav__submenu" in t); print("has_v", "20260905a" in t); m=re.search(r"<title>(.*?)</title>",t); print("title", m.group(1) if m else "-")'
