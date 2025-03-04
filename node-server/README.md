# ScribeAR Node Server

A backend service for ScribeAR to handle authenticating and rebroadcasting transcription events. Built in Node.js with Fastify. 

## Getting Started

### Prerequisites

* Node.js (tested with Node 22)

### Installing dependencies

1. Install dependencies
      ```
      npm install
      ```

### Configuration

* Make a copy of `template.env` and name it `.env`
* Edit `.env` to configure server

### Developing

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

### Usage

**Running in production mode**

1. Ensure dependencies are installed
2. Configure service in `.env`
3. Start webserver
    ```
    npm start
    ```