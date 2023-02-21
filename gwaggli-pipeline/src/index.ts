import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {textToSpeechFile} from "./text-to-speech-file";
import {filter, off} from "./event-system/event-system";
import {dispatchClientMessage, registerClientView} from "./client-view";
import {GwaggliEvent} from "./event-system/events";
import {ClientEventType} from "./event-system/events/client-events";
import {PipelineEventType} from "./event-system/events/pipeline-events";
import {registerPipeline} from "./pipeline";

const {v4: uuidv4} = require('uuid')
const WebSocketServer = require('ws');

dotenv.config();

const app: Express = express();
const webPort = process.env.WEB_PORT;
const websocketPort = process.env.WEBSOCKET_PORT;
const websocketInsights = process.env.WEBSOCKET_INSIGHTS_PORT;

registerPipeline()
registerClientView()

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
    res.sendFile(`${process.cwd()}/generated/voices/${req.params.fileName}`)
});

app.listen(webPort, () => {
    console.log(`⚡️[server]: Web server is running at http://localhost:${webPort}`);
});


// Creating a new websocket server
const wss = new WebSocketServer.Server({port: websocketPort})
// Creating connection using websocket
wss.on("connection", async (ws: WebSocket) => {
    console.log("new client connected");

    const sid = uuidv4();

    const clientFilter = (event: GwaggliEvent) => event.subsystem === "client" &&
        event.sid === sid &&
        event.type !== ClientEventType.AudioChunk;

    const listener = filter(clientFilter, (event) => {
        ws.send(JSON.stringify(event));
    });

    ws.addEventListener("message", (event: MessageEvent<string>) => {
        dispatchClientMessage(sid, event.data);
    });

    ws.addEventListener("close", () => {
        console.log("client disconnected");
        off(listener)
    });

    ws.addEventListener("error", (event) => {
        console.log("client error", event);
        off(listener)
    });
});
console.log(`⚡️[server]: Debugging Websocket server is running at ws://localhost:${websocketPort}`);

const wssInsights = new WebSocketServer.Server({port: websocketInsights})
wssInsights.on("connection", async (ws: WebSocket) => {
    console.log("new insight client connected");
    const filterDebugger = (event: GwaggliEvent) => event.type !== ClientEventType.AudioChunk &&
        event.type !== ClientEventType.ClientViewVoiceActivation &&
        event.type !== PipelineEventType.VoiceActivationLevelUpdate &&
        event.type !== PipelineEventType.AudioBufferUpdate

    const listener = filter(filterDebugger, (event) => {
        ws.send(JSON.stringify(event));
    });

    ws.addEventListener("close", () => {
        console.log("debug client disconnected");
        off(listener)
    });

    ws.addEventListener("error", (event) => {
        console.log("debug client error", event);
        off(listener)
    });
});

