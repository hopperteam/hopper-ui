#!/bin/sh

echo '{"apiRoot": "'$HOPPER_API_URL'", "loginUrl": "'$HOPPER_LOGIN_URL'", "logoutUrl": "'$HOPPER_LOGOUT_URL'"}' > /usr/share/nginx/html/instance.json

nginx -g "daemon off;"
