#!/bin/bash
set -euoo pipefail posix
cd "$(dirname "$0")"

# 
function openssl_md4() {
	# OpenSSL 3.0 & OpenSSL 1.1
	openssl md4 -provider legacy "$@" 2>/dev/null || openssl md4 "$@"
}

function content_hash() {
	local -r file="$1"
	openssl_md4 "$file" | awk '{ print substr($NF, 0, 20) }'
}

# 
VIEWER_MAIN_CSS_PARAM="v=$(content_hash ./docs/main.css)"
readonly VIEWER_MAIN_CSS_PARAM
VIEWER_MAIN_JS_PARAM="v=$(content_hash ./docs/main.js)"
readonly VIEWER_MAIN_JS_PARAM
VIEWER_COPY_JS_PARAM="v=$(content_hash ./docs/copy.js)"
readonly VIEWER_COPY_JS_PARAM

# 
sed -Ei \
	-e 's/(["/]main\.css\?)[^"]*/\1'"$VIEWER_MAIN_CSS_PARAM"'/g' \
	-e 's/(["/]main\.js\?)[^"]*/\1'"$VIEWER_MAIN_JS_PARAM"'/g' \
	-e 's/(["/]copy\.js\?)[^"]*/\1'"$VIEWER_COPY_JS_PARAM"'/g' \
	./docs/index.html

# 
echo 'OK'
