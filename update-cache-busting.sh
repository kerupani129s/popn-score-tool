#!/bin/bash
set -euoo pipefail posix

# 
function content_hash() {
	local -r file="$1"
	openssl md4 "$file" | awk '{ print substr($NF, 0, 20) }'
	return 0
}

# 
VIEWER_MAIN_CSS_PARAM="$(content_hash ./docs/main.css)"
readonly VIEWER_MAIN_CSS_PARAM
VIEWER_MAIN_JS_PARAM="$(content_hash ./docs/main.js)"
readonly VIEWER_MAIN_JS_PARAM

# 
sed -Ei \
	-e 's/(["/]main\.css\?)[^"]*/\1'"$VIEWER_MAIN_CSS_PARAM"'/g' \
	-e 's/(["/]main\.js\?)[^"]*/\1'"$VIEWER_MAIN_JS_PARAM"'/g' \
	./docs/index.html

# 
echo 'OK'
