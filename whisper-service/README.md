# ScribeAR Whisper Service

A backend service for ScribeAR to generate transcriptions from a WAV audio stream. Supports several whisper implementations. Flexible interface allows easy integration with new models. Built in Python with FastAPI.

## Getting Started

### Prerequisites

* Python 3 (tested with Python 3.12)

### Installing dependencies

0. (optional) Create python virtual environment
1. Install global python dependencies
      ```
      pip install -r requirements.txt
      ```

2. Per model implementation dependencies. Each model implementation has its own `{model_implementation}Requirements.txt` found in the `/models` directory. Install the dependencies for the models you'd like to run. See [Model Implementations and Model Keys](#model-implementations-and-model-keys) for details.
    ```
    pip install -r models/{model_implementation}_requirements.txt
    ```

### Configuration

* Make a copy of `template.env` and name it `.env`
* Edit `.env` to configure server. See [Configuration Options](#configuration-options) for details.

## Developing

**Run unit tests**

1. Ensure that you have installed global dependencies dependencies as well as model dependencies for the models that you want to test
2. Run tests with pytest
    ```
    pytest
    ```

**Implementing a new model**

1. Implement `WhisperModelBase`. See `/modelBases/whisper_model_base.py` for required methods and usage.
    * Other model bases found in `/model_bases` can be helpful for implementing commonly used functions.
2. Create `{model_implementation}_requirements.txt` and populate with python dependencies for your model.
3. Associate [model key(s)](#model-implementations-and-model-keys) to your model implementation in `model_factory.py`. 

**Running in development mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    fastapi dev create_server.py
    ```

## Usage

**Running in production mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    python index.py
    ```

## Documentation

### Configuration Options

| Option | Options | Description |
| - | - | - |
| `LOG_LEVEL` | `info`, `debug`, `trace` | Sets the verbosity of logging. |
| `API_KEY` | `string` | The api key that must be passed to whisper-service in order to establish a connection. Should match `apiKey=` url parameter for node server. |
| `HOST` | `ip address` | The socket the whisper service will bind to. Use `0.0.0.0` to make available to local network, `127.0.0.1` to localhost only. |
| `PORT` | `number` | Port number that whisper service will listen for connections on. Should match the port node server is trying to connect to. |

### Model Implementations and Model Keys

Each model key (e.g. `faster-whisper:cpu-tiny-en`, `faster-whisper:gpu-tiny-en`) must be mapped to an model implementation (e.g. `faster-whisper`, `mock-transcription-durration`).

The model key should be prefixed with the name of a model implementation.

A single model implementation might have multiple model keys mapped to it. For example, this could be used to support multiple configurations such as running on cpu vs gpu, language, etc. For model keys for these, a colon `:` should be appended to the model implementation name followed by any unique string.

Below is a table of model keys and model implementations

| Model Key | Model Implementation | Description |
| - | - | - |
| `mock_transcription_duration` | `mock-transcription-duration` | This model does not perform transcriptions. It returns the transcription blocks describing the duration of audio recieved |
| `faster-whisper:gpu-tiny-en` | `faster-whisper` | Run faster whisper using tiny.en model with 2-dim local agreement in 1 second chunks on gpu |
| `faster-whisper:cpu-tiny-en` | `faster-whisper` | Run faster whisper using tiny.en model with 2-dim local agreement in 3 second chunks on cpu |

TODO: Perhaps make model key parsable so that changes for options don't require adding/modifying model key. For example: `faster-whisper:device=gpu,model=tiny.en,agreement=2,chunk=1`.