import React, {useEffect, useState} from "react";
import {off, on} from "../../../event-system/event-system";
import {
    ClientEventType,
    ClientViewState,
    ClientViewUpdate,
    ClientViewVoiceActivation
} from "../../../event-system/events/client-events";
import {Avatar, Card, Col, Divider, List, Progress, Row, Skeleton, Steps} from "antd";
import {GwaggliEventType} from "../../../event-system/events";
import {PipelineEventType} from "../../../event-system/events/pipeline-events";


const steps = [
    PipelineEventType.VoiceActivationStart,
    PipelineEventType.VoiceActivationEnd,
    PipelineEventType.TranscriptionComplete,
    PipelineEventType.TextCompletionFinish,
    PipelineEventType.VoicePersist
].map((step) => step.toString())


const stepsTest = [
    {
        title: 'Höre zu...',
        step: PipelineEventType.VoiceActivationStart,
    },
    {
        title: 'Verarbeite Stimme',
        step: PipelineEventType.VoiceActivationEnd,
    },
    {
        title: 'Denke über deinen Input nach',
        step: PipelineEventType.TranscriptionComplete,
    },
    {
        title: 'Spreche...',
        step: PipelineEventType.TextCompletionFinish,
    },
    {
        title: 'Fertig',
        step: PipelineEventType.VoicePersist,
    }
]


const Insight = () => {

    const [viewState, setViewState] = useState<ClientViewState>()
    const [voiceActivationLevel, setVoiceActivationLevel] = useState<number>(0)

    useEffect(() => {
        const voiceActivationListener = on<ClientViewVoiceActivation>(ClientEventType.ClientViewVoiceActivation, (event) => {
            setVoiceActivationLevel(event.level)
        });

        const viewListener = on<ClientViewUpdate>(ClientEventType.ClientViewUpdate, (event) => {
            setViewState(event.data)
        })

        return () => {
            off(voiceActivationListener)
            off(viewListener)
        }
    }, [setViewState, setVoiceActivationLevel]);


    const conversations = viewState?.conversation.sort((a, b) => a.timestamp - b.timestamp) || []


    const data = conversations.flatMap((chunk, index) => {
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

    return (
        <div>
            <List
                itemLayout="horizontal"
                dataSource={data}
                renderItem={(item) => (
                    <List.Item>
                        <Skeleton avatar={true} title={false} loading={item.loading} active>
                            <List.Item.Meta
                                avatar={<Avatar src={item.title === 'Gwaggli' ? '' : 'https://joesch.moe/api/v1/random'} />}
                                title={<a href="https://ant.design">{item.title}</a>}
                                description={item.description}
                            />
                        </Skeleton>
                    </List.Item>
                )}
            />
            <Progress percent={voiceActivationLevel}></Progress>
        </div>
    )
}

export default Insight