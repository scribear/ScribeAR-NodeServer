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
    pip install -r models/{modelName}Requirements.txt
    ```

### Configuration

* Make a copy of `template.env` and name it `.env`
* Edit `.env` to configure server

### Developing

**Implementing a new model**

1. Implement `WhisperModelBase`. See `/modelBases/whisperModelBase.py` for required methods and usage.
    * Other model bases found in `/modelBases` can be helpful for implementing commonly used functions.
2. Create `{modelName}Requirements.txt` and populate with python dependencies for your model.
3. Associate model key(s) to your model in `modelFactory.py`. 

**Running in development mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    fastapi dev index.py
    ```

### Usage

**Running in production mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    python index.py
    ```