import WebSocketServer from 'ws';
import { getGlobalEventSystem } from '@gwaggli/events/dist/event-system';
import { v4 as uuidv4 } from 'uuid';
import { dispatchClientMessage } from '../../client-view';
import { registerDebugPipeline } from '../../pipeline';
import { EventSystem, GwaggliEvent, GwaggliEventType } from '@gwaggli/events';

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
            event.type !== GwaggliEventType.AudioChunk &&
            event.type !== GwaggliEventType.ClientViewVoiceActivation &&
            event.type !== GwaggliEventType.VoiceActivationLevelUpdate;

        const listener = eventSystem.filter(filterDebugger, (event) => {
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
