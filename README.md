# About

This repository houses the node server and whisper service backend apps that are used to provide self hosted transcriptions for [ScribeAR](https://scribear.illinois.edu/v/index.html).

## Whisper Service

Whisper service receives an audio stream and returns real-time transcriptions. Users can connect to whisper service via websocket either directly using ScribeAR or by using a node server instance that is connected to whisper service. Whisper service is designed to be flexible by supporting multiple speech recognization implementations, allowing to be adapted for various hardware capabilities (including a Raspberry Pi).

## Node Server

Node server is a lightweight service that provides transcription broadcasting capabilities to ScribeAR. A central "kiosk" device is used as an audio source while other users can scan a QR code to receive live transcriptions directly on their own devices. Instead of connecting to whisper service, the kiosk connects to node server, which forwards audio to whisper service instead. This is done to allow a lightweight device to be deployed in classrooms, which a more powerful device can run whisper service elsewhere.

# Getting Started

* [Deployment](https://github.com/scribear/ScribeAR-NodeServer/wiki/Deployment) - Run node server and/or whisper service
* [Connecting From Frontend](https://github.com/scribear/ScribeAR-NodeServer/wiki/Connecting-From-Frontend) - Connect to node server or whisper service from the ScribeAR frontend
* [Developing Node Server](https://github.com/scribear/ScribeAR-NodeServer/wiki/Developing-Node-Server) - Understand how to develop for node server 
* [Developing Whisper Service](https://github.com/scribear/ScribeAR-NodeServer/wiki/Developing-Whisper-Service) - Understand how to develop for whisper service
* [Documentation](https://github.com/scribear/ScribeAR-NodeServer/wiki/Documentation) - Documentation about node server and whisper service