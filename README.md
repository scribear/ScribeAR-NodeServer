# ScribeAR Node Server

Backend for ScribeAR. Handles transcribing audio stream and rebroadcasting transcriptions to multiple devices.

# Getting Started

See the `README.md` files in `/node-server` and `/whisper-service` folders for detailed instructions for installation, configuration, development, and usage of node-server and whisper-service. See [Setup](#setup)

# Setup ScribeAR Server

## Docker Deployment

1. Install Docker using official methods
    * https://www.docker.com/
    * If you'd like to use CUDA, make sure you have the Nvidia Container Toolkit installed as well 
      * https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/index.html
2. Clone this repository
    ```
    git clone https://github.com/scribear/ScribeAR-NodeServer
    ```
3. Make a copy of `template.env` and name it `.env`
4. Edit `.env` to configure deployment.
    * Configuration matches that of [Node Server Configuration](./node-server/README.md#configuration-options) and [Whisper Service Configuration](./whisper-service/README.md#configuration-options) with a few exceptions, noted below.
    * `HOST` and `PORT` for whisper-service and node-server are disabled.
    * `MODEL_KEY` is added for node-server. This is the [model key](#model-implementations-and-model-keys) that node-server will use when connecting to whisper-service.
    * `WHISPER_SERVICE_ENDPOINT` for node-server is removed and instead automatically generated using `MODEL_KEY` and `API_KEY`.
5. Start containers via Docker compose
    * For CPU only deployment
        ```
        docker compose -f ./compose_cpu.yaml up -d
        ```
    * For CUDA deployment
        ```
        docker compose -f ./compose_cpu.yaml up -d
        ```

## Local All-in-one Deployment

Deploys node-server, whisper-service, and ScribeAR frontend to be running on the same system.

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
    cd ScribeAR-NodeServer/whisper-service
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
    cd ../node-server
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
    * For Ubuntu, this can be achieved using by creating the following file at `~/.config/autostart/aio-autostart.desktop`
        ```
        [Desktop Entry]
        Type=Application
        Exec= { PATH TO aio-autostart.sh SCRIPT }
        NoDisplay=false
        X-GNOME-Autostart-enabled=true
        Terminal=true
        ```