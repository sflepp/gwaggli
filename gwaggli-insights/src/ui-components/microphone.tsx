import React, { useEffect, useState } from 'react';
import { encodeWAV } from '../encoder/wav';
import { Button } from 'antd';

interface MicrophoneState {
    mediaStream?: MediaStream;
    context?: AudioContext;
    source?: MediaStreamAudioSourceNode;
    node?: ScriptProcessorNode;
    active: boolean;
}

interface MicrophoneProps {
    onAudioData: (data: ArrayBuffer) => void;
}

const Microphone = ({ onAudioData }: MicrophoneProps) => {
    const [state, setState] = useState<MicrophoneState>({
        node: undefined,
        active: false,
    });

    // https://github.com/hmontazeri/microphone/blob/master/src/Microphone.js
    const start = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        const context = new AudioContext();
        const source = context.createMediaStreamSource(mediaStream);
        const node = context.createScriptProcessor(16_384, 1, 1);

        source.connect(node);
        node.connect(context.destination);

        setState({
            context: context,
            source: source,
            node: node,
            mediaStream: mediaStream,
            active: true,
        });
    };

    useEffect(() => {
        if (state.node) {
            state.node.onaudioprocess = async (e) => {
                const data = e.inputBuffer.getChannelData(0).slice();
                const wavData = encodeWAV(data, {
                    sampleRate: state.context?.sampleRate,
                    mono: true,
                    streaming: false,
                });

                onAudioData(await wavData.arrayBuffer());
            };
        }
    }, [state, onAudioData]);

    return (
        <div>
            <Button disabled={state.active} type="primary" onClick={start}>
                Connect Audio
            </Button>
        </div>
    );
};

export default Microphone;
