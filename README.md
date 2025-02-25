## ScribeAR Node Server

### Developing

In `node-server`

* Install dependencies
  ```
  npm install
  ```
* Make copy of `template.env` and name it `.env`
  * Edit `.env` to configure server
* Run server
  ```
  npm run dev
  ```

In `whisper-service`

* (optional) Create python virtual environment
* Install dependencies
  ```
  pip install -r requirements.txt
  ```
* Run server
  ```
  fastapi dev whisperService.py
  ```