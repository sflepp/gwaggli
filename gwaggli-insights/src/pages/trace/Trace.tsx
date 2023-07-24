import React, { useCallback, useEffect, useState } from 'react';
import Microphone from '../../ui-components/microphone';
import { AudioChunk, EventSystem, GwaggliEvent, GwaggliEventType, WithoutMeta } from '@gwaggli/events';
import useWebSocket from 'react-use-websocket';
import { pipelineHost } from '../../env';
import { encodeBase64 } from '../../encoder/base64';
import ConnectionStatus from '../../ui-components/connection-status';
import { Edge, Node, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import { stratify, tree } from 'd3-hierarchy';

import 'reactflow/dist/style.css';

const g = tree<Node>();

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return { nodes, edges };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { width, height } = document.querySelector(`[data-id="${nodes[0].id}"]`).getBoundingClientRect();
    const hierarchy = stratify<Node>()
        .id((node) => node.id)
        .parentId((node) => edges.find((edge) => edge.target === node.id)?.source);
    const root = hierarchy(nodes);
    const layout = g.nodeSize([width * 2, height * 2])(root);

    return {
        nodes: layout.descendants().map((node) => ({
            ...node.data,
            position: { x: node.x, y: node.y },
        })),
        edges,
    };
};

const Trace = () => {
    return (
        <ReactFlowProvider>
            <TraceFlow />
        </ReactFlowProvider>
    );
};

const TraceFlow = () => {
    const [eventSystem] = useState(new EventSystem());
    const [events, setEvents] = useState<GwaggliEvent[]>([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const { sendMessage, readyState } = useWebSocket(`ws://${pipelineHost}:8001`, {
        onOpen: () => console.log('opened'),
        onMessage: (event) => {
            eventSystem.dispatch(JSON.parse(event.data));
        },
        shouldReconnect: () => true,
        reconnectInterval: 10_000,
    });

    useEffect(() => {
        const listener = eventSystem.filter(
            (event) => event.type !== GwaggliEventType.VoiceActivationLevelUpdate,
            (event) => {
                console.log(event);
                setEvents((events) => [...events, event]);
            }
        );

        return () => {
            eventSystem.off(listener);
        };
    }, [eventSystem]);

    useEffect(() => {
        setNodes(
            events.map((event, index) => {
                return {
                    id: event.meta.id,
                    position: { x: 0, y: index * 100 },
                    data: { label: event.type },
                };
            })
        );

        setEdges(
            events.flatMap((event) => {
                return event.meta.tid.map((tid) => {
                    return {
                        id: `${event.meta.id}-${tid}`,
                        source: tid,
                        target: event.meta.id,
                    };
                });
            })
        );
    }, [events]);

    const sendAudio = (data: ArrayBuffer) => {
        const message: WithoutMeta<AudioChunk> = {
            type: GwaggliEventType.AudioChunk,
            audio: encodeBase64(data),
        };

        sendMessage(JSON.stringify(message));
    };

    const { fitView } = useReactFlow();

    useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges);

        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

        window.requestAnimationFrame(() => {
            fitView();
        });
    }, [nodes, edges]);

    return (
        <div>
            <div style={{ position: 'absolute', right: '0' }}>
                <ConnectionStatus readyState={readyState}></ConnectionStatus>
            </div>
            <Microphone onAudioData={sendAudio}></Microphone>

            <div style={{ width: '100vw', height: '100vh' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                />
            </div>
        </div>
    );
};

export default Trace;
