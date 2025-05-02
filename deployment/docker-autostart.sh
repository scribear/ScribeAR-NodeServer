#!/bin/bash
set -e

NODE_PORT=8080
FRONTEND_PORT=3000
SOURCE_TOKEN="CHANGEME"
SCRIBEAR_URL="http://192.168.10.160:${FRONTEND_PORT}"

until [ "$(curl --max-time 1 -s -w '%{http_code}' -o /dev/null "${SCRIBEAR_URL}")" -eq 200 ]
do
  echo "Can't reach frontend at ${SCRIBEAR_URL}. Waiting for frontend to be ready..."
  sleep 1
done

echo "Launching Chrome"
google-chrome "http://localhost:${FRONTEND_PORT}/?mode=kiosk&kioskServerAddress=localhost:${NODE_PORT}&sourceToken=${SOURCE_TOKEN}&scribearURL=${SCRIBEAR_URL}" --start-fullscreen
