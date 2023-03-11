import useWebSocket, {ReadyState} from "react-use-websocket";
import React, {useEffect, useState} from "react";
import {ClientEventType, EventSystem, PipelineEventType} from "@gwaggli/events";
import {AudioChunk} from "@gwaggli/events/dist/events/client-events";
import {encodeBase64} from "../../encoder/base64";
import Microphone from "../../ui-components/microphone";
import ConnectionStatus from "../../ui-components/connection-status";
import {Card, Col, Progress, Row} from "antd";
import {CopilotProcessingComplete, VoiceActivationLevelUpdate} from "@gwaggli/events/dist/events/pipeline-events";

const Copilot = () => {

    const [eventSystem] = useState(new EventSystem())

    const {sendMessage, readyState} = useWebSocket(`ws://localhost:8002`, {
        onOpen: () => console.log("opened"),
        onMessage: (event) => {
            eventSystem.dispatch(JSON.parse(event.data))
        },
        shouldReconnect: (_) => true,
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

    const [copilot, setCopilot] = useState<CopilotProcessingComplete | undefined>(undefined)
    const [voiceActivationLevel, setVoiceActivationLevel] = useState<number>(0)

    useEffect(() => {

        const voiceActivationListener = eventSystem.on<VoiceActivationLevelUpdate>(PipelineEventType.VoiceActivationLevelUpdate, (event) => {
            setVoiceActivationLevel(event.level)
        });

        const copilotListener = eventSystem.on<CopilotProcessingComplete>(PipelineEventType.CopilotProcessingComplete, (event) => {
            setCopilot(event)
        })

        return () => {
            eventSystem.off(voiceActivationListener)
            eventSystem.off(copilotListener)
        }
    }, [setCopilot, setVoiceActivationLevel]);


    return (<>
            <div style={{position: 'relative'}}>

                <div style={{position: 'absolute', right: '0'}}>
                    <ConnectionStatus readyState={readyState}></ConnectionStatus>
                </div>

                <Microphone onAudioData={sendAudio}></Microphone>


                { readyState === ReadyState.OPEN ? <Progress percent={voiceActivationLevel}></Progress> : null}


                { copilot !== undefined ? <div>
                    <Row gutter={16}>
                        <Col className="gutter-row" span={6}>
                            <Card title="Summary">
                                <div style={{whiteSpace: "pre-wrap"}}>{copilot.summary}</div>
                            </Card>
                        </Col>
                        <Col className="gutter-row" span={6}>
                            <Card title="Facts">
                                <div style={{whiteSpace: "pre-wrap"}}>{copilot.facts}</div>
                            </Card>
                        </Col>
                        <Col className="gutter-row" span={6}>
                            <Card title="Questions">
                                <div style={{whiteSpace: "pre-wrap"}}>{copilot.questions}</div>
                            </Card>
                        </Col>
                        <Col className="gutter-row" span={6}>
                            <Card title="Buzzwords">
                                <div style={{whiteSpace: "pre-wrap"}}>{copilot.buzzwords}</div>
                            </Card>
                        </Col>
                        <Col className="gutter-row" span={24}>
                            <Card title="History">
                                <div style={{whiteSpace: "pre-wrap"}}>{copilot.history}</div>
                            </Card>
                        </Col>
                    </Row>
                </div> : null}
            </div>
        </>
    )
}

export default Copilot