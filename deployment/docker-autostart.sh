#!/bin/bash
set -e

source .env
if [ $WHISPER_SERVICE_CUDA = 'true' ]; then

  echo Starting services with CUDA enabled for whisper-service
  docker compose -f ./compose_cuda.yaml up -d
else
  echo Stopping any currently running services
  docker compose -f ./compose_cpu.yaml down

  echo Starting services without CUDA
  docker compose -f ./compose_cpu.yaml up -d
fi

until [ "$(curl --max-time 1 -s -w '%{http_code}' -o /dev/null "${SCRIBEAR_URL}")" -eq 200 ]
do
  echo "Can't reach frontend at ${SCRIBEAR_URL}. Waiting for frontend to be ready..."
  sleep 1
done

echo "Launching Chrome"
google-chrome "http://localhost:${FRONTEND_PORT}/?mode=kiosk&kioskServerAddress=localhost:${NODE_PORT}&sourceToken=${SOURCE_TOKEN}&scribearURL=${SCRIBEAR_URL}" --start-fullscreen

stop_services() {
  if [ $WHISPER_SERVICE_CUDA = 'true' ]; then
    echo Stopping currently running services
    docker compose -f ./compose_cuda.yaml down
  else
    echo Stopping any currently running services
    docker compose -f ./compose_cpu.yaml down
  fi
}
trap stop_services EXIT