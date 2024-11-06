## ScribeAR Node Server

### Developing

In `node-server`

* Install dependencies
  ```
  npm install
  ```
* Make copy of `template.env` and name it `.env`
  * Edit `.env` to configure server (make sure log directory exists)
* Run server
  ```
  npm run dev
  ```

In `whisper_service`

* (optional) Create python virtual environment
* Install dependencies
  ```
  pip install -r requirements.txt
  ```
* Run server
  ```
  python whisper_server.py --language en --model base
  ```