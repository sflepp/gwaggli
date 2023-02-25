# Gwaggli

Gwaggli is a simple voice processing tool. It consists of the following components:

- gwaggli-insight: A web application to show the results of the processing
- gwaggli-pipeline: A pipeline to process voice streams in real time and output useful information
- gwaggli-whisper: A wrapper for [OpenAI Whisper](https://github.com/openai/whisper) for voice transcription

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

Setup an AWS account with permissions to run [Amazon Polly](https://aws.amazon.com/de/polly/) and add the credentials into the following file:

```
./gwaggli-pipeline/.aws/config.json

{
  "accessKeyId": "<YOUR-ACCESS-KEY-ID>",
  "secretAccessKey": "<YOUR-SECRET-ACCESS-KEY>",
  "region": "eu-central-1"
}
```

Add the [OpenAI API-Key](https://platform.openai.com/account/api-keys) to the following file:

```
./gwaggli-pipeline/.openai/config.json

{
  "apiKey": "<YOUR-API-KEY>
}
```

### gwaggli-whisper

The whisper wrapper is a Python application. To install and run it, do the following:

Install ffmpeg:
```bash
brew install ffmpeg
```

And start the application:

```bash
cd gwaggli-whisper && pip3 install -r requirements.txt && python3 main.py
```