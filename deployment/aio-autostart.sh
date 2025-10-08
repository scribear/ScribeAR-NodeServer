
#!/bin/bash
set -e

NODE_PORT=8080
SOURCE_TOKEN=ANISHM3
SCRIBEAR_URL=http://localhost:3000

SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR
BASE_DIR=$(pwd)

# Disable all shortcuts except basic typing using xmodmap and setxkbmap
# Backup current keymap
xmodmap -pke > "$BASE_DIR/original_keymap.xmodmap"
# Clear all xkb options (removes most modifier behaviors)
setxkbmap -option
# Clear all modifier keys (Ctrl, Alt, Super, etc.)
xmodmap -e "clear control"
xmodmap -e "clear mod1"
xmodmap -e "clear mod2"
xmodmap -e "clear mod3"
xmodmap -e "clear mod4"
xmodmap -e "clear mod5"
# Manually unmap all common modifier key keycodes (Left/Right Ctrl, Alt, Super/Windows, Menu)
for key in 37 105 64 108 133 134 135 50 62 66 77 92; do
  xmodmap -e "keycode $key = NoSymbol"
done
# Disable Escape (9), Tab (23), and F1-F12 (67-96)
for key in 9 23 67 68 69 70 71 72 73 74 75 76 95 96; do
  xmodmap -e "keycode $key = NoSymbol"
done
# This leaves all letter and number keys enabled for typing.

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
cd $BASE_DIR/../whisper-service; 
source .venv/bin/activate; 
python index.py 2>> $BASE_DIR/logs/whisper-service.log &
PYTHON_PID=$!


echo "Starting Node Server"
cd $BASE_DIR/../node-server; 
node ./build/src/index.js >> $BASE_DIR/logs/node-server.log &
NODE_PID=$!
sleep 15


echo "Launching Chrome"
google-chrome "https://scribear.illinois.edu/v/latest/?mode=kiosk&kioskServerAddress=localhost:${NODE_PORT}&sourceToken=${SOURCE_TOKEN}&scribearURL=${SCRIBEAR_URL}" --kiosk