#!/bin/bash
# Opens ScribeAR in kiosk mode once reachable

# This is intended to be used in a kiosk deployment where a dedicated ScribeAR kiosk device is placed in a classroom and needs to open ScribeAR automatically
# This script should be automatically run by kiosk user on login to open ScribeAR kiosk mode

# Note: that this scribe assumes the ScribeAR backend is already running elsewhere

SCRIBEAR_URL="https://<SCRIBEAR_ADDRESS>/?mode=kiosk&kioskServerAddress=<SCRIBEAR_ADDRESS>&sourceToken=CHANGEME&scribearURL=https://<SCRIBEAR_ADDRESS>"

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
