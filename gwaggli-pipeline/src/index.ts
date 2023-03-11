import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {dispatchClientMessage, registerClientView} from "./client-view";
import {registerChatPipeline, registerCopilotPipeline} from "./pipeline";
import {ClientEventType, EventSystem, GwaggliEvent, PipelineEventType} from "@gwaggli/events";
import {getGlobalEventSystem} from "@gwaggli/events/dist/event-system";

const {v4: uuidv4} = require('uuid')
const WebSocketServer = require('ws');

dotenv.config();

const app: Express = express();
const webPort = process.env.WEB_PORT;
const chatPort = process.env.WEBSOCKET_CHAT_PORT;
const copilotPort = process.env.WEBSOCKET_COPILOT_PORT;
const debugPort = process.env.WEBSOCKET_DEBUG_PORT;

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.listen(webPort, () => {
    console.log(`⚡️[server]: Web server is running at http://localhost:${webPort}`);
});


const chatWebsocket = new WebSocketServer.Server({port: chatPort})
chatWebsocket.on("connection", async (ws: WebSocket) => {
    console.log("new chat client connected");

    const eventSystem = new EventSystem();
    getGlobalEventSystem().connect(eventSystem);

    const sid = uuidv4();

    const clientFilter = (event: GwaggliEvent) => event.subsystem === "client" &&
        event.sid === sid &&
        event.type !== ClientEventType.AudioChunk;

    const listener = eventSystem.filter(clientFilter, (event) => {
        ws.send(JSON.stringify(event));
    });

    ws.addEventListener("message", (event: MessageEvent<string>) => {
        dispatchClientMessage(eventSystem, sid, event.data);
    });

    ws.addEventListener("close", () => {
        console.log("client disconnected");
        eventSystem.off(listener)
    });

    ws.addEventListener("error", (event) => {
        console.log("client error", event);
        eventSystem.off(listener)
    });

    registerChatPipeline(eventSystem)
    registerClientView(eventSystem)
});

console.log(`⚡️[server]: Copilot Websocket server is running at ws://localhost:${copilotPort}`);
const suggestionWebsocket = new WebSocketServer.Server({port: copilotPort})
suggestionWebsocket.on("connection", async (ws: WebSocket) => {
    console.log("new copilot client connected");

    const eventSystem = new EventSystem();
    getGlobalEventSystem().connect(eventSystem);

    const sid = uuidv4();

    const clientFilter = (event: GwaggliEvent) => event.sid === sid &&
        event.type !== ClientEventType.AudioChunk;

    const listener = eventSystem.filter(clientFilter, (event) => {
        ws.send(JSON.stringify(event));
    });

    ws.addEventListener("message", (event: MessageEvent<string>) => {
        dispatchClientMessage(eventSystem, sid, event.data);
    });

    ws.addEventListener("close", () => {
        console.log("client disconnected");
        eventSystem.off(listener)
    });

    ws.addEventListener("error", (event) => {
        console.log("client error", event);
        eventSystem.off(listener)
    });

    registerCopilotPipeline(eventSystem);
});

console.log(`⚡️[server]: Debugging Websocket server is running at ws://localhost:${chatPort}`);

const debugWebsocket = new WebSocketServer.Server({port: debugPort})
debugWebsocket.on("connection", async (ws: WebSocket) => {
    console.log("new debug client connected");
    const filterDebugger = (event: GwaggliEvent) => event.type !== ClientEventType.AudioChunk &&
        event.type !== ClientEventType.ClientViewVoiceActivation &&
        event.type !== PipelineEventType.VoiceActivationLevelUpdate &&
        event.type !== PipelineEventType.AudioBufferUpdate

    const listener = getGlobalEventSystem().filter(filterDebugger, (event) => {
        ws.send(JSON.stringify(event));
    });

    ws.addEventListener("close", () => {
        console.log("debug client disconnected");
        getGlobalEventSystem().off(listener)
    });

    ws.addEventListener("error", (event) => {
        console.log("debug client error", event);
        getGlobalEventSystem().off(listener)
    });
});