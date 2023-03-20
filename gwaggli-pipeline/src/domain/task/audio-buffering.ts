import {WaveData} from "../data/wave-data";
import {ClientEventType, EventSystem, PipelineEventType} from "@gwaggli/events";
import {AudioChunk} from "@gwaggli/events/dist/events/client-events";
import {Buffer} from "buffer";

export const registerAudioBuffering = (eventSystem: EventSystem) => {
    let buffers: Map<string, WaveData> = new Map<string, WaveData>();

    eventSystem.on<AudioChunk>(ClientEventType.AudioChunk, (event) => {
        let existingChunk = buffers.get(event.sid);

        const newChunk = new WaveData(Buffer.from(event.audio, 'base64'));

        if (existingChunk === undefined) {
            existingChunk = newChunk;
        } else {
            existingChunk = existingChunk.merge(newChunk);
        }

        buffers.set(event.sid, existingChunk);

        eventSystem.dispatch({
            type: PipelineEventType.AudioBufferUpdate,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            audio: existingChunk.buffer.toString('base64')
        })
    });
}