import {ClientEventType, EventSystem, GwaggliEvent, PipelineEventType} from "@gwaggli/events";
import {registerAudioBuffering} from "./audio-buffering";
import {exampleWaveFileData} from "../data/wave-data-example";
import {WaveData} from "../data/wave-data";

const sampleAudioMessage: GwaggliEvent = {
    type: ClientEventType.AudioChunk,
    subsystem: "client",
    sid: "1",
    timestamp: Date.now(),
    audio: exampleWaveFileData
};

let eventSystem: EventSystem;
let result: any[];
beforeEach(() => {
    result = [];
    eventSystem = new EventSystem();

    eventSystem.on(PipelineEventType.AudioBufferUpdate, (event) => {
        result.push(event);
    });

    registerAudioBuffering(eventSystem);
});

it("should emit AudioBufferUpdate", () => {
    eventSystem.dispatch(sampleAudioMessage);

    expect(result.length).toBe(1);
});

it('should export valid wave data', () => {
    eventSystem.dispatch(sampleAudioMessage);

    const resultingWaveData = new WaveData(Buffer.from(result[0].audio, 'base64'));

    expect(resultingWaveData.getDuration()).toBeCloseTo(19098, 0);
    expect(resultingWaveData.getLoudnessAt(1)).toBeCloseTo(6);
});

it('should export valid concatenated wave data', () => {
    eventSystem.dispatch(sampleAudioMessage);
    eventSystem.dispatch(sampleAudioMessage);

    const resultingWaveData = new WaveData(Buffer.from(result[1].audio, 'base64'));

    expect(resultingWaveData.getDuration()).toBeCloseTo(19098 * 2, 0);
    expect(resultingWaveData.getLoudnessAt(0)).toBeCloseTo(36);
    expect(resultingWaveData.getLoudnessAt(19098)).toBeCloseTo(36);
});
