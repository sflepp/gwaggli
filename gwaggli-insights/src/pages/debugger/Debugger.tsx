import React, {useState} from "react";
import useWebSocket from "react-use-websocket";
import {ClientEventType, GwaggliEvent, PipelineEventType} from "@gwaggli/events";
import {Table, TableColumnsType, Typography} from "antd";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {docco} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Waveform from "../../ui-components/waveform";
import UuidVisualize from "../../ui-components/uuid-visualize";
import {DomainEventType} from "@gwaggli/events/dist/events/domain-events";
import {pipelineHost} from "../../env";
import ConnectionStatus from "../../ui-components/connection-status";

const {Text} = Typography;


interface DataType {
    key: React.Key;
    event: GwaggliEvent;
    sid: string;
    trackId?: string;
    timestamp: number;
    deltaTime: number;
    type: string;
}

const Debugger = () => {

    const [events, setEvents] = useState<GwaggliEvent[]>([])

    const {readyState} = useWebSocket(`ws://${pipelineHost}:8888`, {
        onOpen: () => console.log("opened"),
        onMessage: (message) => {
            const event = JSON.parse(message.data) as GwaggliEvent
            console.log(event)
            setEvents((events) => {
                return [...events, event]
            });
        }
    })

    const items = events
        .map((event, index) => {
            return {
                key: index,
                sid: event.sid,
                timestamp: event.timestamp,
                deltaTime: event.timestamp - (events[Math.max(0, index - 1)].timestamp),
                type: event.type,
                trackId: "trackId" in event ? event.trackId : undefined,
                event: event
            }
        })
        .filter(event =>
            event.type !== ClientEventType.ClientViewUpdate &&
            event.type !== PipelineEventType.VoicePersist &&
            event.type !== PipelineEventType.VoiceActivationPersist
        )
        .reverse()

    const columns: TableColumnsType<DataType> = [
        {title: 'SID', dataIndex: 'sid', key: 'sid', render: SidRenderer},
        {title: 'Time', dataIndex: 'timestamp', key: 'timestamp', render: TimestampRenderer},
        {title: 'Event', dataIndex: 'type', key: 'type', render: EventRenderer},
        {title: 'Delta Time', dataIndex: 'deltaTime', key: 'deltaTime', render: DeltaTime},
        {title: 'Track ID', dataIndex: 'trackId', key: 'trackId', render: TrackIdRenderer},
        {title: 'Details', dataIndex: 'details', key: 'details', render: Details},
    ];

    return (<>
        <Table
            columns={columns}
            dataSource={items}
            expandable={{expandedRowRender: ExpandedRow}}
            pagination={{pageSize: 100}}
        >
        </Table>
        <div style={{position: 'absolute', right: '0', top: '0'}}>
            <ConnectionStatus readyState={readyState}></ConnectionStatus>
        </div>
    </>)
}

const ExpandedRow = (record: DataType) => {
    return <div style={{overflow: 'hidden', maxWidth: '800px', position: 'relative'}}>
        <SyntaxHighlighter language="json" style={docco}>
            {JSON.stringify(record.event, null, 4)}
        </SyntaxHighlighter>
    </div>
}

const TimestampRenderer = (value: any) => {
    const date = new Date(value)
    const time = date.toISOString()
    return <>
        {time}
    </>
}

const SidRenderer = (value: any) => {
    return <>
        <UuidVisualize uuid={value}></UuidVisualize>
    </>
}

const TrackIdRenderer = (value: any, record: any) => {
    return record.event.trackId ? <UuidVisualize uuid={record.event.trackId}></UuidVisualize> : <></>
}
const EventRenderer = (value: any, record: DataType) => {
    return <>
        <Text code>{record.event.type}</Text>
    </>
}

const DeltaTime = (value: any, record: DataType) => {
    return record.deltaTime.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' ms';
}

const Details = (value: any, record: DataType) => {
    switch (record.event.type) {
        case PipelineEventType.CopilotProcessingComplete:
            return <>
                <Text code>summary</Text><Text type="secondary">{shorten(record.event.summary, 100)}</Text><br/>
                <Text code>history</Text><Text type="secondary">{shorten(record.event.history, 100)}</Text><br/>
                <Text code>facts</Text><Text type="secondary">{shorten(record.event.facts, 100)}</Text><br/>
                <Text code>buzzwords</Text><Text type="secondary">{shorten(record.event.buzzwords, 100)}</Text>
            </>
        case PipelineEventType.TranscriptionComplete:
            return <>
                <Text code>text</Text><Text type="secondary">{shorten(record.event.text, 100)}</Text>
            </>
        case PipelineEventType.VoiceActivationStart:
            return <>
                <Text code>startMarker</Text><Text type="secondary">{record.event.startMarker}</Text>
            </>
        case PipelineEventType.VoiceActivationEnd:
            return <>
                <Text code>endMarker</Text><Text type="secondary">{record.event.endMarker}</Text>
            </>
        case PipelineEventType.VoiceActivationPersist:
            return <>
                <Text code>filename</Text><Text type="secondary">{shorten(record.event.fileName, 100)}</Text>
            </>
        case PipelineEventType.VoiceActivationDataAvailable:
            return <Waveform audio={'data:audio/wav;base64,' + record.event.audio}/>
        case DomainEventType.AdvisorAnswer:
            return <>
                <Text code>text</Text><Text type="secondary">{shorten(record.event.text, 100)}</Text><br/>
                <Waveform audio={'data:audio/wav;base64,' + record.event.audio}/>
            </>
        case PipelineEventType.PipelineError:
            return <>
                <Text code>error</Text><Text type="secondary">{shorten(record.event.error, 100)}</Text><br/>
            </>
        case PipelineEventType.TextCompletionFinish:
            return <>
                <Text code>text</Text><Text type="secondary">{shorten(record.event.text, 100)}</Text><br/>
            </>
        case PipelineEventType.TextToVoiceFinish:
            return <>
                <Waveform audio={'data:audio/wav;base64,' + record.event.audio}/>
            </>
        case PipelineEventType.VoicePersist:
            return <>
                <Text code>filename</Text><Text type="secondary">{shorten(record.event.fileName, 100)}</Text>
            </>
        default:
            return <div>Not implemented</div>
    }
}

const shorten = (text: string, length: number) => {
    if (text.length > length) {
        return text.substring(0, length) + '...'
    }
    return text
}


export default Debugger;
