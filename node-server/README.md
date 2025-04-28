# ScribeAR Node Server

A backend service for ScribeAR to handle authenticating and rebroadcasting transcription events. Built in Node.js with Fastify. 

## Getting Started

### Prerequisites

* Node.js (tested with Node 20)

### Installing dependencies

1. Install dependencies
      ```
      npm install
      ```

### Configuration

* Make a copy of `template.env` and name it `.env`
* Edit `.env` to configure server. See [Configuration Options](#configuration-options) for details.

## Developing

**Running in development mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    npm run dev
    ```

**Running unit tests**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Run tests
    ```
    npm run test
    ```

## Usage

**Running in production mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    npm start
    ```

## Documentation

### Configuration Options

| Option | Options | Description |
| - | - | - |
| `NODE_ENV` | `development`, `production`, `test` | Indicates the environment service is running in. Currently unused. (TODO: API documentation endpoint in dev mode) |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug`, `trace`, `silent` | Sets the verbosity of logging. |
| `HOST` | `ip address` | The socket the whisper service will bind to. Use `0.0.0.0` to make available to local network, `127.0.0.1` to localhost only. |
| `PORT` | `number` | Port number that whisper service will listen for connections on. Should match the port node server is trying to connect to. |
| `USE_HTTPS` | `boolean` | Whether to use HTTPS or not |
| `KEY_FILEPATH` | `string` | File path to the private key file for use in when `USE_HTTPS` is set to `true` |
| `CERTIFICATE_FILEPATH` | `string` | File path to the certificate file for use in when `USE_HTTPS` is set to `true` |
| `CORS_ORIGIN` | `string` | Cors origin configuration for node server. |
| `SERVER_ADDRESS` | `string` | Address the node server is reachable at. Used for ScribeAR QR code to allow other device to connect. |
| `WHISPER_SERVICE_ENDPOINT` | `websocket address` | Websocket address for whisper service endpoint. Should be in the format: <br> `ws://{ADDRESS}:{PORT}/whisper?api_key={API_KEY}&model_key={MODEL_KEY}` <br> ADDRESS is the address or ip of the whisper service. For an all-in-one deployment, this is `127.0.0.1` (localhost). <br> `PORT` is the port the whisper service is listening on. This should match what the whisper service is configured to use. <br> `API_KEY` is the api key for the whisper service. This should match what the whisper service is configured to use. <br> `MODEL_KEY` is the model key of the model that the whisper service should run. See [Model Implementations and Model Keys](../whisper-service/README.md#model-implementations-and-model-keys) for more information. |
| `REQUIRE_AUTH` | `true`, `false` | If `true`, requires authentication to connect to node server api, otherwise no authentication is used. See [Authentication](#authentication) for details. |
| `ACCESS_TOKEN_REFRESH_INTERVAL_SEC` | `number` | Number of seconds to wait before generating a new refresh token. See [Authentication](#authentication) for details. |
| `ACCESS_TOKEN_BYTES` | `number` | The number of random bytes used to generate access tokens |
| `ACCESS_TOKEN_VALID_PERIOD_SEC` | `number` | Number of seconds a newly generated refresh token is valid for. See [Authentication](#authentication) for details. |
| `SESSION_TOKEN_BYTES` | `number` | The number of random bytes used to generate session tokens |
| `SESSION_LENGTH_SEC` | `number` | Number of seconds a newly generated session token is valid for. See [Authentication](#authentication) for details. |

### Authentication

* TODO: Explain authentication strategy here.