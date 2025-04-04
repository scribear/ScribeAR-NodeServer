#!/bin/bash
set -e

SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR
BASE_DIR=$(pwd)

# Ensure whisper service and node server are stopped when script exits
stop_children() {
  kill $PYTHON_PID || true
  kill $NODE_PID || true
}
trap stop_children EXIT


# Create location for logs
mkdir -p $BASE_DIR/logs


echo "Starting Whisper Service"
/bin/bash -c "
	cd $BASE_DIR/whisper-service; 
	source .venv/bin/activate; 
	python index.py 2>> $BASE_DIR/logs/whisper-service.log 
" &
PYTHON_PID=$!


echo "Starting Node Server"
/bin/bash -c "
	cd $BASE_DIR/node-server; 
	npm start >> $BASE_DIR/logs/node-server.log
" &
NODE_PID=$!
sleep 15


echo "Launching Chrome"
google-chrome "https://scribear.illinois.edu/v/latest/"
