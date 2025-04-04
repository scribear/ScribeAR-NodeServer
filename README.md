# ScribeAR Node Server

Backend for ScribeAR. Handles transcribing audio stream and rebroadcasting transcriptions to multiple devices.

## Getting Started

* See `README.md` in `/node-server` and `/whisper-service` folders for detailed instructions for installation, development, and usage.

## Usage

### All-in-one Deployment

Deploys node-server, whisper-service, and ScribeAR frontend to be running on the same system.

**Setup**

1. Install Node 20, Python 3, and Google Chrome using official methods
    * https://nodejs.org/en/download
    * https://www.python.org/downloads/
    * https://www.google.com/intl/en_au/chrome/
2. Clone this repository
    ```
    git clone https://github.com/scribear/ScribeAR-NodeServer
    ```
3. Setup whisper-service
    ```
    cd ../whisper-service
    ```
    ```
    python3 -m venv .venv
    ```
    ```
    . .venv/bin/activate
    ```
    ```
    pip install -r requirements.txt
    ```
4. Install requirements for the whisper implementations you want to use. See [Installing Whisper Service Dependencies](./whisper-service/README.md#installing-dependencies) for details.
    ```
    pip install -r models/{model_implementation}_requirements.txt
    ```
5. Make a copy of `template.env` and name it `.env`
    * Edit `.env` according to [Whisper Service Configuration](./whisper-service/README.md#configuration-options)
6. Build node-server
    ```
    cd ScribeAR-NodeServer/node-server
    ```
    ```
    npm install
    ```
    ```
    npm run build
    ```
7. Make a copy of `template.env` and name it `.env`
    * Edit `.env` according to [Node Server Configuration](./node-server/README.md#configuration-options)
    * Ensure port, api_key, and model_key match between whisper service and node server configurations.
8. The `aio-autostart.sh` script can then be used to start whisper service, node server, and google chrome automatically. Set this to automatically run on login with a user that is automatically logged in to have a hands free startup.