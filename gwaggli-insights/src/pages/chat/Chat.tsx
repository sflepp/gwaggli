import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useEffect, useState } from 'react';
import {
    AudioChunk,
    EventSystem,
    GwaggliEventType,
    TextCompletionFinish,
    TranscriptionComplete,
    VoiceActivationLevelUpdate,
    VoiceActivationStart,
    WithoutMeta,
} from '@gwaggli/events';
import { encodeBase64 } from '../../encoder/base64';
import Microphone from '../../ui-components/microphone';
import ConnectionStatus from '../../ui-components/connection-status';
import { Avatar, List, Progress, Skeleton } from 'antd';
import { pipelineHost } from '../../env';

interface ConversationItem {
    loading: boolean;
    title: string;
    description: string;
}

const Chat = () => {
    const [eventSystem] = useState(new EventSystem());

    const { sendMessage, readyState } = useWebSocket(`ws://${pipelineHost}:8001`, {
        onOpen: () => console.log('opened'),
        onMessage: (event) => {
            eventSystem.dispatch(JSON.parse(event.data));
        },
        shouldReconnect: () => true,
        reconnectInterval: 10_000,
    });

    const sendAudio = (data: ArrayBuffer) => {
        const message: WithoutMeta<AudioChunk> = {
            type: GwaggliEventType.AudioChunk,
            audio: encodeBase64(data),
        };

        sendMessage(JSON.stringify(message));
    };

    const [voiceActivationLevel, setVoiceActivationLevel] = useState<number>(0);
    const [conversation, setConversation] = useState<ConversationItem[]>([]);

    useEffect(() => {
        const voiceActivationListener = eventSystem.on<VoiceActivationLevelUpdate>(
            GwaggliEventType.VoiceActivationLevelUpdate,
            (event) => {
                setVoiceActivationLevel(event.level);
            }
        );

        const voiceActivationStartListener = eventSystem.on<VoiceActivationStart>(
            GwaggliEventType.VoiceActivationStart,
            () => {
                setConversation([...conversation, { loading: true, title: 'You', description: 'Loading...' }]);
            }
        );

        const transcriptionCompleteListener = eventSystem.on<TranscriptionComplete>(
            GwaggliEventType.TranscriptionComplete,
            (event) => {
                setConversation([
                    ...conversation.filter((item) => !item.loading),
                    { loading: false, title: 'You', description: event.text },
                    { loading: true, title: 'Gwaggli', description: 'Loading...' },
                ]);
            }
        );

        const textCompletionFinishListener = eventSystem.on<TextCompletionFinish>(
            GwaggliEventType.TextCompletionFinish,
            (event) => {
                setConversation([
                    ...conversation.filter((item) => !item.loading),
                    { loading: false, title: 'Gwaggli', description: event.text },
                ]);
            }
        );

        return () => {
            eventSystem.off(voiceActivationListener);
            eventSystem.off(voiceActivationStartListener);
            eventSystem.off(transcriptionCompleteListener);
            eventSystem.off(textCompletionFinishListener);
        };
    }, [setVoiceActivationLevel, conversation, setConversation, eventSystem]);

    return (
        <>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', right: '0' }}>
                    <ConnectionStatus readyState={readyState}></ConnectionStatus>
                </div>

                <Microphone onAudioData={sendAudio}></Microphone>

                <div>
                    {conversation.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={conversation}
                            renderItem={(item) => (
                                <List.Item>
                                    <Skeleton avatar={true} title={false} loading={item.loading} active>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    src={
                                                        item.title === 'Gwaggli'
                                                            ? '/gwaggli.jpg'
                                                            : 'https://joesch.moe/api/v1/random'
                                                    }
                                                />
                                            }
                                            title={<a href="https://ant.design">{item.title}</a>}
                                            description={item.description}
                                        />
                                    </Skeleton>
                                </List.Item>
                            )}
                        />
                    ) : null}
                    {readyState === ReadyState.OPEN ? <Progress percent={voiceActivationLevel}></Progress> : null}
                </div>
            </div>
        </>
    );
};

export default Chat;
