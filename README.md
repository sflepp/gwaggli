# Gwaggli

Gwaggli is a simple voice processing tool. It consists of the following components:

-   gwaggli-events: An event system that allows to read and write gwaggli events
-   gwaggli-insights: A web application to show the results of the processing
-   gwaggli-pipeline: A pipeline to process voice streams in real time and output useful information

## Installation & Usage

### gwaggli-events

Build the gwaggli-events library with the following command:

```bash
cd gwaggli-events && npm install && npm run build
```

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

#### Preparation

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

Add the [Replicate API-Key](https://replicate.ai/) to the following file:

```
./gwaggli-pipeline/.replicate/config.json

{
  "apiKey": "<YOUR-API-KEY>
}
```

Add the [elevenlabs.io API-Key](https://elevenlabs.io/) to the following file:

```
./gwaggli-pipeline/.elevenlabs/config.json

{
  "apiKey": "<YOUR-API-KEY>
}
```
