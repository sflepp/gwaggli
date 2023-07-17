import WebSocketServer from 'ws';
import { getGlobalEventSystem } from '@gwaggli/events/dist/event-system';
import { v4 as uuidv4 } from 'uuid';
import { dispatchClientMessage } from '../../client-view';
import { registerCopilotPipeline } from '../../pipeline';
import { EventSystem, GwaggliEvent, GwaggliEventType } from '@gwaggli/events';

export const startCopilotServer = () => {
    const copilotPort = process.env.WEBSOCKET_COPILOT_PORT;

    const suggestionWebsocket = new WebSocketServer.Server({ port: Number(copilotPort) });
    console.log(`⚡️[server]: Copilot Websocket server is running at ws://localhost:${copilotPort}`);

    suggestionWebsocket.on('connection', async (ws: WebSocket) => {
        console.log('new copilot client connected');

        const eventSystem = new EventSystem();
        getGlobalEventSystem().connect(eventSystem);

        const sid = uuidv4();

        const clientFilter = (event: GwaggliEvent) => event.sid === sid && event.type !== GwaggliEventType.AudioChunk;

        const listener = eventSystem.filter(clientFilter, (event) => {
            ws.send(JSON.stringify(event));
        });

        ws.addEventListener('message', (event: MessageEvent<string>) => {
            dispatchClientMessage(eventSystem, sid, event.data);
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
