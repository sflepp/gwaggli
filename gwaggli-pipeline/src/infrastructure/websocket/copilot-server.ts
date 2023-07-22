import WebSocketServer from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { registerCopilotPipeline } from '../../pipeline';
import {
    dispatchWithoutMeta,
    EventSystem,
    getGlobalEventSystem,
    GwaggliEvent,
    GwaggliEventType,
    WithoutMeta,
} from '@gwaggli/events';

export const startCopilotServer = () => {
    const copilotPort = process.env.WEBSOCKET_COPILOT_PORT;

    const suggestionWebsocket = new WebSocketServer.Server({ port: Number(copilotPort) });
    console.log(`⚡️[server]: Copilot Websocket server is running at ws://localhost:${copilotPort}`);

    suggestionWebsocket.on('connection', async (ws: WebSocket) => {
        console.log('new copilot client connected');

        const eventSystem = new EventSystem();
        getGlobalEventSystem().connect(eventSystem);

        const sid = uuidv4();

        const clientFilter = (event: GwaggliEvent) =>
            event.meta.sid === sid && event.type !== GwaggliEventType.AudioChunk;

        const listener = eventSystem.filter(clientFilter, (event) => {
            ws.send(JSON.stringify(event));
        });

        ws.addEventListener('message', (websocketEvent: MessageEvent<string>) => {
            try {
                const event = JSON.parse(websocketEvent.data) as WithoutMeta<GwaggliEvent>;
                dispatchWithoutMeta(eventSystem, sid, event);
            } catch (e) {
                console.error(e);
            }
        });

        ws.addEventListener('close', () => {
            console.log('client disconnected');
            eventSystem.off(listener);
        });

        ws.addEventListener('error', (event) => {
            console.log('client error', event);
            eventSystem.off(listener);
        });

        registerCopilotPipeline(eventSystem);
    });
};
