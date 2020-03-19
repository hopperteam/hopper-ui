#!/bin/sh

echo '{"apiRoot": "'$HOPPER_API_URL'"}' > /usr/share/nginx/html/instance.json

nginx -g "daemon off;"
