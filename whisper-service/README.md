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

2. Per model dependencies. Each model has its own `{modelName}Requirements.txt` found in the `/models` directory. Install the dependencies for the models you'd like to run.
    ```
    pip install -r models/{modelName}_requirements.txt
    ```

### Configuration

* Make a copy of `template.env` and name it `.env`
* Edit `.env` to configure server

### Developing

**Run unit tests**

1. Install dependencies defined in `test_requirements.txt`
    ```
    pip install -r test_requirements.txt
    ```
2. Run tests with pytest
    ```
    pytest
    ```

**Implementing a new model**

1. Implement `WhisperModelBase`. See `/modelBases/whisper_model_base.py` for required methods and usage.
    * Other model bases found in `/model_bases` can be helpful for implementing commonly used functions.
2. Create `{modelName}_requirements.txt` and populate with python dependencies for your model.
3. Associate model key(s) to your model in `model_factory.py`. 

**Running in development mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    fastapi dev create_server.py
    ```

### Usage

**Running in production mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    python index.py
    ```