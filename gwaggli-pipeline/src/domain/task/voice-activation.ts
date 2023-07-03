import { EventSystem, PipelineEventType } from "@gwaggli/events";
import {
    AudioBufferUpdate,
    VoiceActivationDataAvailable,
    VoiceActivationEnd,
    VoiceActivationStart
} from "@gwaggli/events/dist/events/pipeline-events";
import { WaveData } from "../data/wave-data";
import { Buffer } from "buffer";
import crypto from "crypto";
import fs from "fs";
import { SubPipelineConfig } from "../../pipeline";


const { v4: uuidv4 } = require('uuid')

export const registerVoiceActivationDetection = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    const voiceActivation = new Map<string, VoiceActivationStart>()

    eventSystem.on<AudioBufferUpdate>(PipelineEventType.AudioBufferUpdate, (event) => {
        let windowDuration = 1000; // milliseconds

        const audio = new WaveData(Buffer.from(event.audio, 'base64'));

        const startMarker = Math.max(audio.getDuration() - windowDuration, 0);
        const endMarker = audio.getDuration()

        const samples = [];
        for (let i = startMarker; i <= endMarker; i += 10) {
            const loudness = audio.getLoudnessAt(i)
            samples.push(loudness);
        }

        const averageLoudness = samples.reduce((a, b) => a + b, 0) / samples.length;

        if (voiceActivation.has(event.sid)) {
            eventSystem.dispatch({
                type: PipelineEventType.VoiceActivationLevelUpdate,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                level: 100
            })
        } else {
            eventSystem.dispatch({
                type: PipelineEventType.VoiceActivationLevelUpdate,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                level: Math.round(averageLoudness / config.voiceActivationStartLevel * config.voiceActivationMaxLevel)
            })
        }

        if (!voiceActivation.has(event.sid) && averageLoudness > config.voiceActivationStartLevel) {

            const trackId = uuidv4();

            const voiceActivationStart: VoiceActivationStart = {
                type: PipelineEventType.VoiceActivationStart,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: trackId,
                startMarker: startMarker
            }

            voiceActivation.set(event.sid, voiceActivationStart)

            eventSystem.dispatch(voiceActivationStart)
        }

        if (voiceActivation.has(event.sid) && averageLoudness < config.voiceActivationEndLevel) {

            eventSystem.dispatch({
                type: PipelineEventType.VoiceActivationEnd,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: (voiceActivation.get(event.sid) as VoiceActivationStart).trackId,
                endMarker: endMarker
            })

            voiceActivation.delete(event.sid)
        }
    });
}

export const registerVoiceActivationDataProcessing = (eventSystem: EventSystem) => {

    let bufferedData: WaveData;
    const startEvents: VoiceActivationStart[] = []

    eventSystem.on<AudioBufferUpdate>(PipelineEventType.AudioBufferUpdate, (event) => {
        bufferedData = new WaveData(Buffer.from(event.audio, 'base64'));
    });

    eventSystem.on<VoiceActivationStart>(PipelineEventType.VoiceActivationStart, (startEvent) => {
        startEvents.push(startEvent);
    });

    eventSystem.on<VoiceActivationEnd>(PipelineEventType.VoiceActivationEnd, (endEvent) => {
        const startEvent = startEvents.find((startEvent) => startEvent.trackId === endEvent.trackId)

        if (startEvent) {
            const startIndex = bufferedData.getByteIndexAtTime(startEvent.startMarker);
            const endIndex = bufferedData.getByteIndexAtTime(endEvent.endMarker);

            const audio = bufferedData.slice(startIndex, endIndex);

            eventSystem.dispatch({
                type: PipelineEventType.VoiceActivationDataAvailable,
                subsystem: "pipeline",
                sid: startEvent.sid,
                timestamp: Date.now(),
                trackId: startEvent.trackId,
                audio: audio.buffer.toString('base64')
            })
        }
    });
}

export const registerVoiceActivationPersist = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(PipelineEventType.VoiceActivationDataAvailable, (event) => {
        const hash = crypto
            .createHash('sha256')
            .update(event.audio)
            .digest('hex');

        const fileName = `audio-${new Date().getTime()}-${hash}.wav`
        const folder = `./generated/voice-activation`;
        const path = `${folder}/${fileName}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        fs.writeFileSync(path, Buffer.from(event.audio, 'base64'));

        eventSystem.dispatch({
            type: PipelineEventType.VoiceActivationPersist,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            fileName: fileName
        });
    });
}

export const registerVoiceActivation = (eventSystem: EventSystem, config: SubPipelineConfig) => {
    registerVoiceActivationDetection(eventSystem, config);
    registerVoiceActivationDataProcessing(eventSystem);
    registerVoiceActivationPersist(eventSystem);
}
