import useWebSocket, {ReadyState} from "react-use-websocket";
import React, {useEffect, useState} from "react";
import {ClientEventType, EventSystem} from "@gwaggli/events";
import {
    AudioChunk,
    ClientViewState,
    ClientViewUpdate,
    ClientViewVoiceActivation
} from "@gwaggli/events/dist/events/client-events";
import {encodeBase64} from "../../encoder/base64";
import Microphone from "../../ui-components/microphone";
import ConnectionStatus from "../../ui-components/connection-status";
import {Avatar, List, Progress, Skeleton} from "antd";
import { pipelineHost } from "../../env";

const Chat = () => {

    const [eventSystem] = useState(new EventSystem())

    const {sendMessage, readyState} = useWebSocket(`ws://${pipelineHost}:8001`, {
        onOpen: () => console.log("opened"),
        onMessage: (event) => {
            eventSystem.dispatch(JSON.parse(event.data))
        },
        shouldReconnect: () => true,
        reconnectInterval: 10_000,
    })

    const sendAudio = (data: ArrayBuffer) => {
        const message: AudioChunk = {
            type: ClientEventType.AudioChunk,
            sid: '',
            subsystem: "client",
            timestamp: Date.now(),
            audio: encodeBase64(data)
        }

        sendMessage(JSON.stringify(message));
    }

    const [viewState, setViewState] = useState<ClientViewState>()
    const [voiceActivationLevel, setVoiceActivationLevel] = useState<number>(0)

    useEffect(() => {

        const voiceActivationListener = eventSystem.on<ClientViewVoiceActivation>(ClientEventType.ClientViewVoiceActivation, (event) => {
            setVoiceActivationLevel(event.level)
        });

        const viewListener = eventSystem.on<ClientViewUpdate>(ClientEventType.ClientViewUpdate, (event) => {
            setViewState(event.data)
        })

        return () => {
            eventSystem.off(voiceActivationListener)
            eventSystem.off(viewListener)
        }
    }, [setViewState, setVoiceActivationLevel]);


    const conversations = viewState?.conversation.sort((a, b) => a.timestamp - b.timestamp) || []


    const data = conversations.flatMap((chunk) => {
        return [
            {
                loading: chunk.prompt === undefined,
                title: 'You',
                description: chunk.prompt
            },
            {
                loading: chunk.answer === undefined,
                title: 'Gwaggli',
                description: chunk.answer
            }
        ]
    })


    return (<>
            <div style={{position: 'relative'}}>

                <div style={{position: 'absolute', right: '0'}}>
                    <ConnectionStatus readyState={readyState}></ConnectionStatus>
                </div>

                <Microphone onAudioData={sendAudio}></Microphone>

                <div>
                    {data.length > 0 ? <List
                        itemLayout="horizontal"
                        dataSource={data}
                        renderItem={(item) => (
                            <List.Item>
                                <Skeleton avatar={true} title={false} loading={item.loading} active>
                                    <List.Item.Meta
                                        avatar={<Avatar
                                            src={item.title === 'Gwaggli' ? '' : 'https://joesch.moe/api/v1/random'}/>}
                                        title={<a href="https://ant.design">{item.title}</a>}
                                        description={item.description}
                                    />
                                </Skeleton>
                            </List.Item>
                        )}
                    /> : null}
                    { readyState === ReadyState.OPEN ? <Progress percent={voiceActivationLevel}></Progress> : null}
                </div>
            </div>
        </>
    )
}

export default Chat
