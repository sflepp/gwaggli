import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {textToSpeech} from "./text-to-speech";
import {Buffer} from "buffer";
import {reportEmitter} from "./reporter";
import {ConversationChunkEvent, registerPipeline, reportAudioChunk, reportError, reportStreamEnd} from "./pipeline";
import EventEmitter from "events";

const WebSocketServer = require('ws');

dotenv.config();

const app: Express = express();
const webPort = process.env.WEB_PORT;
const websocketPort = process.env.WEBSOCKET_PORT;

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.get('/text-to-speech', async (req: Request, res: Response) => {
    if (req.query.text) {
        const fileName = await textToSpeech(req.query.text as string, 'Daniel')
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

    ws.addEventListener("message", (event: MessageEvent<Buffer>) => {
        reportAudioChunk(pipeline, event.data);
    });

    ws.addEventListener("close", () => {
        reportStreamEnd(pipeline);
    });

    ws.addEventListener("error", (error) => {
        console.log("Websocket error", error)
        reportError(pipeline, error);
    });

    pipeline.on("progress", (progressEvent: ProgressEvent) => {
        ws.send(JSON.stringify(progressEvent))
    });

    pipeline.on("text-to-speech", (event: ConversationChunkEvent) => {
        ws.send(JSON.stringify(event))
    });

    reportEmitter.on("progress", (progressEvent: ProgressEvent) => {
        ws.send(JSON.stringify(progressEvent))
    });

    registerPipeline(pipeline);
});
console.log(`⚡️[server]: Websocket server is running at ws://localhost:${websocketPort}`);

