import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {textToSpeech} from "./text-to-speech";
import {Buffer} from "buffer";
import {conversationPipeline} from "./pipeline";
import {AudioDataRingBuffer} from "./audio-data";

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

app.listen(webPort, () => {
    console.log(`⚡️[server]: Web server is running at http://localhost:${webPort}`);
});


// Creating a new websocket server
const wss = new WebSocketServer.Server({port: websocketPort})

// Creating connection using websocket
wss.on("connection", async (ws: WebSocket) => {
    console.log("new client connected");

    const audioStream = new AudioDataRingBuffer({
        sampleRate: 16_000,
        bytesPerSample: 2,
        mediaFormat: 'pcm'
    });

    ws.addEventListener("message", (event: MessageEvent<Buffer>) => {
        audioStream.write(event.data);
    });

    ws.addEventListener("close", () => {
        audioStream.close();
    });

    ws.addEventListener("error", (error) => {
        console.log("Websocket error", error)
        audioStream.close();
    });
    
    const pipeline = conversationPipeline(audioStream);
});
console.log(`⚡️[server]: Websocket server is running at ws://localhost:${websocketPort}`);

