import WebSocketServer from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { registerDebugPipeline } from '../../pipeline';
import {
    dispatchWithoutMeta,
    EventSystem,
    getGlobalEventSystem,
    GwaggliEvent,
    GwaggliEventType,
    WithoutMeta,
} from '@gwaggli/events';

export const startDebuggingServer = () => {
    const debugPort = process.env.WEBSOCKET_DEBUG_PORT;

    const debugWebsocket = new WebSocketServer.Server({ port: Number(debugPort) });
    console.log(`⚡️[server]: Debugging Websocket server is running at ws://localhost:${debugPort}`);

    debugWebsocket.on('connection', async (ws: WebSocket) => {
        console.log('new debug client connected');

        const eventSystem = new EventSystem();
        eventSystem.connect(getGlobalEventSystem());

        const sid = uuidv4();
        const filterDebugger = (event: GwaggliEvent) =>
            event.type !== GwaggliEventType.AudioChunk && event.type !== GwaggliEventType.VoiceActivationLevelUpdate;

        const listener = eventSystem.filter(filterDebugger, (event) => {
            ws.send(JSON.stringify(event));
        });

        ws.addEventListener('message', (event: MessageEvent<string>) => {
            try {
                const gwaggliEvent = JSON.parse(event.data) as WithoutMeta<GwaggliEvent>;
                dispatchWithoutMeta(eventSystem, sid, gwaggliEvent);
            } catch (e) {
                console.error(e);
            }
        });

        ws.addEventListener('close', () => {
            console.log('debug client disconnected');
            eventSystem.off(listener);
        });

        ws.addEventListener('error', (event) => {
            console.log('debug client error', event);
            eventSystem.off(listener);
        });

        registerDebugPipeline(eventSystem);
    });
};
