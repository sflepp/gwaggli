import dotenv from 'dotenv';
import { startChatServer } from './infrastructure/websocket/chat-server';
import { startAdvisoryServer } from './infrastructure/websocket/advisory-server';
import { startCopilotServer } from './infrastructure/websocket/copilot-server';
import { startDebuggingServer } from './infrastructure/websocket/debugging-server';

const main = () => {
    dotenv.config();

    startChatServer();
    startCopilotServer();
    startAdvisoryServer();
    startDebuggingServer();
};

main();
