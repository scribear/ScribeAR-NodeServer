# ScribeAR Node Server

A backend service for ScribeAR to handle authenticating and rebroadcasting transcription events. Users connect to node-server via websocket to send audio and/or receive transcriptions. When node-server receives wav audio chunks from the frontend it sends them to whisper-service to be transcribed. When it receives transcriptions back, it forwards them to all clients that are listening for transcriptions.

# Getting Started

node-server can either be run via Docker or locally. See [Running via Docker](#running-via-docker) to run with docker or [Running Locally](#running-locally) to run locally. If you'd like to develop node-server, see [Developing](#developing).

# Usage

## Running via Docker

* TODO: Instructions for pulling container image and running

## Running Locally

### Local Setup

1. Make sure you have Node.js installed. node-service has been tested to work with Node 20.
2. Install Node dependencies
    ```
    npm install
    ```
3. Make a copy of `template.env` and name it `.env`
4. Edit `.env` to configure server. See [Configuration Options](#configuration-options) for details.

### Running Server

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup)) 
2. If you want to run node-server
    ```
    npm start
    ```

# Developing

## Running in Development Mode

You can run node-server in development mode for easy to read logs and so that the server is automatically restarted when you save changes. This uses `tsc` to build the app, `tsc-watch` to watch for changes, and `pino-pretty` to output nice looking logs.

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup)) 
2. Start webserver
    ```
    npm run dev
    ```

## Running Unit Tests

Unit tests are run via `vitest` with code coverage via istanbul. See `vitest.config.ts` for test configuration.

1. Ensure dependencies are installed (See [Local Setup](#local-setup))
2. Run tests
    ```
    npm run test
    ```

# Documentation

## Configuration Options

The following options can be configured via environment variable.

| Option | Values | Default | Description |
| - | - | - | - |
|**Runtime Options**|||
| `NODE_ENV` | `development`, `production`, `test` | `production` | Indicates the environment service is running in. |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug`, `trace`, `silent` | `info` | Sets the verbosity of logging. |
|**Server Options**|||
| `HOST` | `ip address` | `127.0.0.1` | The socket the whisper service will bind to. Use `0.0.0.0` to make available to local network, `127.0.0.1` to localhost only. |
| `PORT` | `number` | `8080` | Port number that whisper service will listen for connections on. Should match the port node server is trying to connect to. |
| `CORS_ORIGIN` | `string` | `*` | Cors origin configuration for node server. |
| `SERVER_ADDRESS` | `string` | `127.0.0.1:8080` | Address the node server is reachable at. Used for ScribeAR QR code to allow other device to connect. |
| `USE_HTTPS` | `boolean` | `false` | Whether to use HTTPS or not |
| `KEY_FILEPATH` | `string` | Empty string | File path to the private key file for use in when `USE_HTTPS` is set to `true` |
| `CERTIFICATE_FILEPATH` | `string` | Empty string | File path to the certificate file for use in when `USE_HTTPS` is set to `true` |
|**Whisper Service Options**|||
| `WHISPER_SERVICE_ENDPOINT` | `websocket address` | Required, no default value | Websocket address for whisper service endpoint. Should be in the format: <br> `ws://{ADDRESS}:{PORT}/whisper?api_key={API_KEY}&model_key={MODEL_KEY}` <br> ADDRESS is the address or ip of the whisper service. For an all-in-one deployment, this is `127.0.0.1` (localhost). <br> `PORT` is the port the whisper service is listening on. This should match what the whisper service is configured to use. <br> `API_KEY` is the api key for the whisper service. This should match what the whisper service is configured to use. <br> `MODEL_KEY` is the model key of the model that the whisper service should run. See [Model Implementations and Model Keys](../whisper-service/README.md#model-implementations-and-model-keys) for more information. |
| `WHISPER_RECONNECT_INTERVAL` | `number` | `1` | Number of seconds to wait before attempting to reconnect to whisper service. Server implements exponential backoff, so interval will double each time connection fails up to a maximum of 30 seconds. |
|**Authentication Options**|||
| `REQUIRE_AUTH` | `true`, `false` | `true` | If `true`, requires authentication to connect to node server api, otherwise no authentication is used. See [Authentication](#authentication) for details. |
| `ACCESS_TOKEN_REFRESH_INTERVAL_SEC` | `number` | `150` | Number of seconds to wait before generating a new refresh token. See [Authentication](#authentication) for details. |
| `ACCESS_TOKEN_BYTES` | `number` | `32` | The number of random bytes used to generate access tokens |
| `ACCESS_TOKEN_VALID_PERIOD_SEC` | `number` | `300` | Number of seconds a newly generated refresh token is valid for. See [Authentication](#authentication) for details. |
| `SESSION_TOKEN_BYTES` | `number` | `8` | The number of random bytes used to generate session tokens |
| `SESSION_LENGTH_SEC` | `number` | `5400` | Number of seconds a newly generated session token is valid for. See [Authentication](#authentication) for details. |

## Authentication

* TODO: Explain authentication strategy here.