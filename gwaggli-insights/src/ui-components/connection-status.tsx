import { ReadyState } from 'react-use-websocket';
import StatusIndicator from './status-indicator';
import React from 'react';

interface ConnectionStatusProps {
    readyState: ReadyState;
}

const ConnectionStatus = ({ readyState }: ConnectionStatusProps) => {
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Disconnected',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const connectionStatusColor = {
        [ReadyState.CONNECTING]: 'orange',
        [ReadyState.OPEN]: 'green',
        [ReadyState.CLOSING]: 'orange',
        [ReadyState.CLOSED]: 'red',
        [ReadyState.UNINSTANTIATED]: 'red',
    }[readyState] as 'red' | 'green' | 'orange';

    return (
        <div className="connection-status">
            <StatusIndicator color={connectionStatusColor}></StatusIndicator>
            <span className="connection-status-label">{connectionStatus}</span>
        </div>
    );
};

export default ConnectionStatus;
