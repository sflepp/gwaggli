import WebSocketServer from 'ws';
import { getGlobalEventSystem } from '@gwaggli/events/dist/event-system';
import { v4 as uuidv4 } from 'uuid';
import { dispatchClientMessage } from '../../client-view';
import { registerAdvisoryPipeline } from '../../pipeline';
import { EventSystem, GwaggliEvent, GwaggliEventType } from '@gwaggli/events';

export const startAdvisoryServer = () => {
    const advisoryPort = process.env.WEBSOCKET_ADVISORY_PORT;

    const advisoryWebsocket = new WebSocketServer.Server({ port: Number(advisoryPort) });
    console.log(`⚡️[server]: Advisory Websocket server is running at ws://localhost:${advisoryPort}`);

    advisoryWebsocket.on('connection', async (ws: WebSocket) => {
        console.log('new advisory client connected');

        const eventSystem = new EventSystem();
        getGlobalEventSystem().connect(eventSystem);

        const sid = uuidv4();

        const clientFilter = (event: GwaggliEvent) => event.sid === sid && event.type !== GwaggliEventType.AudioChunk;

        const listener = eventSystem.filter(clientFilter, (event) => {
            ws.send(JSON.stringify(event));
        });

        ws.addEventListener('message', (event: MessageEvent<string>) => {
            try {
                dispatchClientMessage(eventSystem, sid, event.data);
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

        registerAdvisoryPipeline(eventSystem);
    });
};
