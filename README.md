# Gwaggli

Gwaggli is a simple voice processing tool. It consists of the following components:

-   gwaggli-events: An event system that allows to read and write gwaggli events
-   gwaggli-insights: A web application to show the results of the processing
-   gwaggli-pipeline: A pipeline to process voice streams in real time and output useful information

## Installation & Usage

### Preparation

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

### Running the project

Run the following command to install all dependencies:

```bash
npm install
```

Run the following command to build all relevant components:

```bash
npm run build
```

Run the following command to start the application:

```bash
npm run start
```

If you want to start the application with live-reload, run the following command:

```bash
npm run dev
```
