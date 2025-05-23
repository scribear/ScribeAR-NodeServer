#!/bin/bash
set -e

NODE_PORT=8080
SOURCE_TOKEN=CHANGEME
SCRIBEAR_URL=http://localhost:3000

SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR
BASE_DIR=$(pwd)

# Ensure whisper service and node server are stopped when script exits
stop_children() {
  kill $PYTHON_PID
  kill $NODE_PID

	wait $PYTHON_PID
	wait $NODE_PID
}
trap stop_children EXIT


# Create location for logs
mkdir -p $BASE_DIR/logs


echo "Starting Whisper Service"
cd $BASE_DIR/whisper-service; 
source .venv/bin/activate; 
python index.py 2>> $BASE_DIR/logs/whisper-service.log &
PYTHON_PID=$!


echo "Starting Node Server"
cd $BASE_DIR/node-server; 
node ./build/src/index.js >> $BASE_DIR/logs/node-server.log &
NODE_PID=$!
sleep 15


echo "Launching Chrome"
google-chrome "https://scribear.illinois.edu/v/latest/?mode=kiosk&kioskServerAddress=localhost:${NODE_PORT}&sourceToken=${SOURCE_TOKEN}&scribearURL=${SCRIBEAR_URL}" --start-fullscreen