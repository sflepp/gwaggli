import React from 'react';
import useWebSocket from 'react-use-websocket';
import { pipelineHost } from '../../env';
import FileSelector from '../../ui-components/file-selector';
import ConnectionStatus from '../../ui-components/connection-status';
import { encodeBase64 } from '../../encoder/base64';
import { GwaggliEventType, KnowledgeLocationAvailable } from '@gwaggli/events';

const DataLoader = () => {
    const { sendMessage, readyState } = useWebSocket(`ws://${pipelineHost}:8888`);

    const onFileSelected = async (file: File) => {
        const data = encodeBase64(await file.arrayBuffer());

        const message: KnowledgeLocationAvailable = {
            type: GwaggliEventType.KnowledgeLocationAvailable,
            sid: '',
            timestamp: Date.now(),
            locationType: 'inline/zip',
            location: file.name,
            data: data,
        };

        sendMessage(JSON.stringify(message));
    };

    return (
        <div>
            <div style={{ position: 'absolute', right: '0' }}>
                <ConnectionStatus readyState={readyState}></ConnectionStatus>
            </div>

            <FileSelector onFileSelected={onFileSelected} />
        </div>
    );
};

export default DataLoader;
