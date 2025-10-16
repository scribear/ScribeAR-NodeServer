#!/bin/bash
# Opens ScribeAR in kiosk mode once reachable

# This is intended to be used in a kiosk deployment where a dedicated ScribeAR kiosk device is placed in a classroom and needs to open ScribeAR automatically
# This script should be automatically run by kiosk user on login to open ScribeAR kiosk mode

# Note: that this scribe assumes the ScribeAR backend is already running elsewhere

SCRIBEAR_URL="https://<SCRIBEAR_ADDRESS>/?mode=kiosk&kioskServerAddress=<SCRIBEAR_ADDRESS>&sourceToken=CHANGEME&scribearURL=https://<SCRIBEAR_ADDRESS>"

# Disable all shortcuts except basic typing using xmodmap and setxkbmap
# Backup current keymap
xmodmap -pke > "$BASE_DIR/original_keymap.xmodmap"
setxkbmap -option
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

# Loop until ScribeAR is reachable with curl
curl -s $SCRIBEAR_URL >/dev/null
while [ $? -ne 0 ]; do
  echo $SCRIBEAR_URL could not be reached, retrying in 5 seconds.

  sleep 5
  curl -s $SCRIBEAR_URL >/dev/null
done

# Prevent Chrome from showing "Google Chrome didn't shut down correctly" popup
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/google-chrome/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/google-chrome/Default/Preferences

# Start google chrome and open ScribeAR
google-chrome -noerrdialogs --disable-infobars --no-first-run --start-maximized --start-fullscreen --kiosk $SCRIBEAR_URL
