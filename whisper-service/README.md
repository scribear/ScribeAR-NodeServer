# ScribeAR Whisper Service

A backend service for ScribeAR to generate transcriptions from a WAV audio stream. Uses a flexible interface Python to allow for multiple transcription backends.

# Getting Started

whisper-service can either be run via Docker or locally. See [Running via Docker](#running-via-docker) to run with docker or [Running Locally](#running-locally) to run locally. If you'd like to develop node-server, see [Developing](#developing). Additional documentation can be found at [Documentation](#documentation).

# Usage

## Running via Docker

* TODO: Instructions for pulling container image and running

## Running Locally

### Local Setup

1. Make sure you ahve Python 3 installed. whisper-service has been tested to work with with Python 3.12.
2. (optional) Create python virtual environment
3. Install global python dependencies
    ```
    pip install -r requirements.txt
    ```
4. Make a copy of `template.env` and name it `.env`
5. Edit `.env` to configure server. See [Configuration Options](#configuration-options) for details.

### Running Server

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup))
2. Run whisper-service
    ```
    python index.py
    ```

# Developing

## Running in Development Mode

You can run whisper-service in development mode so that the server is automatically restarted when you save changes.

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup))
2. Start webserver
    ```
    fastapi dev create_server.py
    ```

## Running Unit Tests

Unit tests are run using `pytest`. Test coverage stats can be seen by passing additional arguments to `pytest`. A Github Action runs unit tests when a PR is created, make sure tests pass before creating a PR.

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup))
2. 
   * Run tests with pytest without code coverage
        ```
        pytest
        ```
    * Run tests with pytest with code coverage. Coverage results can be found in `htmlcov` folder
        ```
        pytest --cov=. --cov-report=html
        ```

## Running Linter 

`pylint` is used to lint code to ensure consistent code style. A Github Action runs linter when a PR is created to enforce this, make sure linter is successful before creating a PR.

1. Ensure that the app is installed and configured locally (See [Local Setup](#local-setup))
2. 
   * For a single file:
        ```
        pylint [path_to_file]
        ```
   * For all `.py` files in source control
        ```
        pylint $(git ls-files '*.py')
        ```

## Build Docker Container

To test your local changes in a Docker container you can build it locally. A Github Action builds Docker container when a PR is created, make sure build is successful before creating a PR.

1. Ensure you have Docker installed.
2. Build container
    * For CPU only container
        ```
        docker -t scribear-whisper-service -f ./Dockerfile_CPU .
        ```
    * For CUDA support
        ```
        docker -t scribear-whisper-service-cuda -f ./Dockerfile_CUDA .
        ```
3. Run container (additional configuration can be passed in via `--env` flag)
    * For CPU only container
        ```
        docker run --env PORT=8080 --env HOST=0.0.0.0 --env API_KEY=CHANGEME -p 8080:8080 scribear-whisper-service:latest
        ```
    * For CUDA support
        ```
        docker run --env PORT=8080 --env HOST=0.0.0.0 --env API_KEY=CHANGEME -p 8080:8080 --gpus all scribear-whisper-service-cuda:latest
        ```
## Implementing a New Model

1. Implement `TranscriptionModelBase`. See `/model_bases/transcription_model_base.py` for required methods and usage.
    * Other model bases found in `/model_bases` can be helpful for implementing commonly used functions.
2. Add python dependencies for your model to `requirements.txt`.
3. Associate [model key(s)](#model-implementations-and-model-keys) to your model implementation in `model_factory.py`. 

# Documentation

## Configuration Options

| Option      | Options                  | Description                                                                                                                                   |
|-------------|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `LOG_LEVEL` | `info`, `debug`, `trace` | Sets the verbosity of logging.                                                                                                                |
| `API_KEY`   | `string`                 | The api key that must be passed to whisper-service in order to establish a connection. Should match `api_key=` url parameter for node server. |
| `HOST`      | `ip address`             | The socket the whisper service will bind to. Use `0.0.0.0` to make available to local network, `127.0.0.1` to localhost only.                 |
| `PORT`      | `number`                 | Port number that whisper service will listen for connections on. Should match the port node server is trying to connect to.                   |

## Model Implementations and Model Keys

Each model key (e.g. `faster-whisper:cpu-tiny-en`, `faster-whisper:gpu-tiny-en`) must be mapped to an model implementation (e.g. `faster-whisper`, `mock-transcription-duration`).

The model key should be prefixed with the name of a model implementation.

A single model implementation might have multiple model keys mapped to it. For example, this could be used to support multiple configurations such as running on cpu vs gpu, language, etc. For model keys for these, a colon `:` should be appended to the model implementation name followed by any unique string.

Below is a table of model keys and model implementations

| Model Key                     | Model Implementation          | Description                                                                                                               |
|-------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `mock_transcription_duration` | `mock-transcription-duration` | This model does not perform transcriptions. It returns the transcription blocks describing the duration of audio recieved |
| `faster-whisper:gpu-large-v3` | `faster-whisper`              | Run faster whisper using large-v3 model with 2-dim local agreement in 3 second chunks on gpu                              |
| `faster-whisper:cpu-tiny-en`  | `faster-whisper`              | Run faster whisper using tiny.en model with 2-dim local agreement in 3 second chunks on cpu                               |
