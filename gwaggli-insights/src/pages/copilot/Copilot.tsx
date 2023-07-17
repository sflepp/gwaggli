import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useEffect, useState } from 'react';
import { encodeBase64 } from '../../encoder/base64';
import Microphone from '../../ui-components/microphone';
import ConnectionStatus from '../../ui-components/connection-status';
import { Card, Col, Progress, Row } from 'antd';
import { pipelineHost } from '../../env';
import {
    AudioChunk,
    CopilotProcessingComplete,
    EventSystem,
    GwaggliEventType,
    VoiceActivationLevelUpdate,
} from '@gwaggli/events';

const Copilot = () => {
    const [eventSystem] = useState(new EventSystem());

    const { sendMessage, readyState } = useWebSocket(`ws://${pipelineHost}:8002`, {
        onOpen: () => console.log('opened'),
        onMessage: (event) => {
            eventSystem.dispatch(JSON.parse(event.data));
        },
        shouldReconnect: () => true,
        reconnectInterval: 10_000,
    });

    const sendAudio = (data: ArrayBuffer) => {
        const message: AudioChunk = {
            type: GwaggliEventType.AudioChunk,
            timestamp: Date.now(),
            audio: encodeBase64(data),
        };

        sendMessage(JSON.stringify(message));
    };

    const [copilot, setCopilot] = useState<CopilotProcessingComplete | undefined>(undefined);
    const [voiceActivationLevel, setVoiceActivationLevel] = useState<number>(0);

    useEffect(() => {
        const voiceActivationListener = eventSystem.on<VoiceActivationLevelUpdate>(
            GwaggliEventType.VoiceActivationLevelUpdate,
            (event) => {
                setVoiceActivationLevel(event.level);
            }
        );

        const copilotListener = eventSystem.on<CopilotProcessingComplete>(
            GwaggliEventType.CopilotProcessingComplete,
            (event) => {
                setCopilot(event);
            }
        );

        return () => {
            eventSystem.off(voiceActivationListener);
            eventSystem.off(copilotListener);
        };
    }, [setCopilot, setVoiceActivationLevel]);

    return (
        <>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', right: '0' }}>
                    <ConnectionStatus readyState={readyState}></ConnectionStatus>
                </div>

                <Microphone onAudioData={sendAudio}></Microphone>

                {readyState === ReadyState.OPEN ? <Progress percent={voiceActivationLevel}></Progress> : null}

                {copilot !== undefined ? (
                    <div>
                        <Row gutter={16}>
                            <Col className="gutter-row" span={6}>
                                <Card title="Summary">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{copilot.summary}</div>
                                </Card>
                            </Col>
                            <Col className="gutter-row" span={6}>
                                <Card title="Facts">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{copilot.facts}</div>
                                </Card>
                            </Col>
                            <Col className="gutter-row" span={6}>
                                <Card title="Questions">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{copilot.questions}</div>
                                </Card>
                            </Col>
                            <Col className="gutter-row" span={6}>
                                <Card title="Buzzwords">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{copilot.buzzwords}</div>
                                </Card>
                            </Col>
                            <Col className="gutter-row" span={24}>
                                <Card title="History">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{copilot.history}</div>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : null}
            </div>
        </>
    );
};

export default Copilot;
