import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {textToSpeechFile} from "./text-to-speech-file";
import {Buffer} from "buffer";
import {TextToSpeechEvent, registerPipeline, reportAudioChunk, reportError, reportStreamEnd} from "./pipeline";
import EventEmitter from "events";
import {reportEmitter, reportMessageProgress} from "./reporter";
import {CharacterAnswerMessage} from "./domain/messaging/messages";

const WebSocketServer = require('ws');

dotenv.config();

const app: Express = express();
const webPort = process.env.WEB_PORT;
const websocketPort = process.env.WEBSOCKET_PORT;
const websocketInsights = process.env.WEBSOCKET_INSIGHTS_PORT;

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.get('/text-to-speech', async (req: Request, res: Response) => {
    if (req.query.text) {
        const fileName = await textToSpeechFile(req.query.text as string, 'Daniel')
        console.log(process.cwd())
        res.sendFile(`${process.cwd()}/${fileName}`)
        return
    }

    res.send('Created text to speech');
})

app.get('/answers/:filename', async (req: Request, res: Response) => {
    res.sendFile(`${process.cwd()}/generated/voices/${req.params.filename}`)
});

app.listen(webPort, () => {
    console.log(`⚡️[server]: Web server is running at http://localhost:${webPort}`);
});


// Creating a new websocket server
const wss = new WebSocketServer.Server({port: websocketPort})
// Creating connection using websocket
wss.on("connection", async (ws: WebSocket) => {
    console.log("new client connected");

    const pipeline = new EventEmitter();

    ws.addEventListener("message", (event: MessageEvent<string>) => {
        const message = JSON.parse(event.data);

        if (message.type === 'audio-chunk') {
            reportAudioChunk(pipeline, Buffer.from(message.data, 'base64'));
            return;
        }
    });

    ws.addEventListener("close", () => {
        reportStreamEnd(pipeline);
    });

    ws.addEventListener("error", (error) => {
        console.log("Websocket error", error)
        reportError(pipeline, error);
    });

    pipeline.on("text-to-speech", (event: TextToSpeechEvent) => {
        const message: CharacterAnswerMessage = {
            type: 'character-answer',
            data: event.audio.getBuffer().toString('base64'),
            transcript: event.answer
        }

        ws.send(JSON.stringify(message));
    });

    registerPipeline(pipeline);
});
console.log(`⚡️[server]: Websocket server is running at ws://localhost:${websocketPort}`);

const wssInsights = new WebSocketServer.Server({port: websocketInsights})
wssInsights.on("connection", async (ws: WebSocket) => {
   console.log("new insight client connected");

   reportEmitter.on("progress", (progressEvent: ProgressEvent) => {
       ws.send(JSON.stringify(progressEvent))
   });
});

