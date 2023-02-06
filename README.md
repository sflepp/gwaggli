# Gwaggli

Gwaggli is a simple voice processing tool. It consists of the following components:

- gwaggli-insight: A web application to show the results of the processing
- gwaggli-pipeline: A pipeline to process voice streams in real time
- gwaggli-whisper: A wrapper for OpenAI whisper for voice transcription

## Installation & Usage

### gwaggli-insights

The web application is a simple React application. To install and run it, do the following:

```bash
cd gwaggli-insights && npm install && npm start
```
### gwaggli-pipeline

The pipeline is a NodeJS application. To install and run it, do the following:

```bash
cd gwaggli-pipeline && npm install && npm run dev
```

### gwaggli-whisper

The whisper wrapper is a Python application. To install and run it, do the following:

```bash
cd gwaggli-whisper && pip3 install -r requirements.txt && python3 main.py
```