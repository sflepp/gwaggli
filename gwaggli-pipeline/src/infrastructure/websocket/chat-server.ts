import WebSocketServer from 'ws';
import { getGlobalEventSystem } from '@gwaggli/events/dist/event-system';
import { v4 as uuidv4 } from 'uuid';
import { dispatchClientMessage, registerClientView } from '../../client-view';
import { registerChatPipeline } from '../../pipeline';
import { EventSystem, GwaggliEvent, GwaggliEventType } from '@gwaggli/events';

export const startChatServer = () => {
    const chatPort = process.env.WEBSOCKET_CHAT_PORT;

    const chatWebsocket = new WebSocketServer.Server({ port: Number(chatPort) });
    console.log(`⚡️[server]: Chat Websocket server is running at ws://localhost:${chatPort}`);

    chatWebsocket.on('connection', async (ws: WebSocket) => {
        console.log('new chat client connected');

        const eventSystem = new EventSystem();
        getGlobalEventSystem().connect(eventSystem);

        const sid = uuidv4();

        const clientFilter = (event: GwaggliEvent) =>
            event.sid === sid &&
            (event.type === GwaggliEventType.ClientViewUpdate ||
                event.type === GwaggliEventType.ClientViewVoiceActivation);

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

        registerChatPipeline(eventSystem);
        registerClientView(eventSystem);
    });
};
