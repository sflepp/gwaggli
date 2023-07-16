import {
    averageLevel,
    SimplePcmVoiceActivation,
    SimplePcmVoiceActivationConfig
} from "./simple-pcm-voice-activation";
import fs from "fs";
import {WAV_HEADER_SIZE} from "../../data/wave-data";
import {Buffer} from "buffer";

const exampleSpeech1: Buffer = fs.readFileSync('./__test-data__/audio/wav/example-speech-1.wav')

const exampleConfig: SimplePcmVoiceActivationConfig = {
    observeMilliseconds: 1000,
    observeSampleResolution: 10,
    activationThreshold: 400,
    deactivationThreshold: 300,
}

class SimplePcmVoiceActivationSpec extends SimplePcmVoiceActivation {
    constructor(config: SimplePcmVoiceActivationConfig) {
        super(config);
    }

    get activeBuffer() {
        return this._activeBuffer;
    }

    get buffer() {
        return this._buffer;
    }

    get header() {
        return this._header;
    }

    get bufferMaxSize() {
        return this._bufferMaxSize;
    }
}


it('should process first sample with RIFF/WAVE header information', () => {
    const sut = new SimplePcmVoiceActivationSpec(exampleConfig);
    const sample = exampleSpeech1.subarray(0, 8000) // First sample has WAFF/RIFF header information
    sut.next(sample);

    expect(sut.header).toBeDefined();
    expect(sut.header!.sampleRate).toBe(48000);
    expect(sut.header!.bitsPerSample).toBe(16);
    expect(sut.header!.channels).toBe(1);
    expect(sut.bufferMaxSize).toBe(48000 * 2);
    expect(sut.buffer.length).toBe(8000 - WAV_HEADER_SIZE);
    expect(sut.activeBuffer).toBeUndefined()
})

it('should process first and second sample', () => {
    const sut = new SimplePcmVoiceActivationSpec(exampleConfig);

    const sample1 = exampleSpeech1.subarray(0, 8000); // First sample has WAFF/RIFF header information
    sut.next(sample1);

    const sample2 = exampleSpeech1.subarray(8000, 16000); // Second sample has no WAFF/RIFF header information
    sut.next(sample2);

    expect(sut.buffer.length).toBe(16000 - WAV_HEADER_SIZE);
    expect(sut.activeBuffer).toBeUndefined()
})

it('should not exceed idle buffer size when full file is processed', () => {
    const sut = new SimplePcmVoiceActivationSpec(exampleConfig);

    for (let i = 0; i < exampleSpeech1.length; i += 8000) {
        const sample = exampleSpeech1.subarray(i, Math.min(exampleSpeech1.length, i + 8000));
        sut.next(sample);
    }

    expect(sut.buffer.length).toBe(sut.bufferMaxSize)
});


it('should calculate average level for 8bit samples', () => {
    const bitsPerSample = 8;
    const bytesPerSample = bitsPerSample / 8;
    const buffer = Buffer.alloc(128 * bytesPerSample);

    for (let i = 0; i < buffer.length; i += bytesPerSample) {
        buffer.writeUint8(80, i)
    }

    const result = averageLevel(buffer, bitsPerSample, 16)

    expect(result).toBe(80);
});

it('should calculate average level for 16bit samples', () => {
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const buffer = Buffer.alloc(128 * bytesPerSample);

    for (let i = 0; i < buffer.length; i += bytesPerSample) {
        buffer.writeUint16LE(80, i)
    }

    const result = averageLevel(buffer, 16, 16)

    expect(result).toBe(80);
});

it('should calculate average level for 32bit samples', () => {
    const bitsPerSample = 32;
    const bytesPerSample = bitsPerSample / 8;
    const buffer = Buffer.alloc(128 * bytesPerSample);

    for (let i = 0; i < buffer.length; i += bytesPerSample) {
        buffer.writeUint32LE(80, i)
    }

    const result = averageLevel(buffer, 32, 16)

    expect(result).toBe(80);
});

it('should calculate average level for 32bit samples even if the resoultion doesn\'t fit into array size', () => {
    const bitsPerSample = 32;
    const bytesPerSample = bitsPerSample / 8;
    const buffer = Buffer.alloc(128 * bytesPerSample);

    for (let i = 0; i < buffer.length; i += bytesPerSample) {
        buffer.writeUint32LE(80, i)
    }

    const result = averageLevel(buffer, 32, 47)

    expect(result).toBe(80);
});

it('should be fast for large buffers', () => {
    const buffer = Buffer.alloc(1_000_000); // 1 MB
    buffer.fill(80);

    const start = performance.now()
    const result = averageLevel(buffer, 8, 1000)
    const end = performance.now()

    expect(end - start).toBeLessThan(10); // 10 ms
    expect(result).toBe(80);
});

it('should tell when it is active', () => {
    const sut = new SimplePcmVoiceActivationSpec(exampleConfig);
    const active = []

    for (let i = 0; i < exampleSpeech1.length; i += 48_000) {
        const sample = exampleSpeech1.subarray(i, Math.min(exampleSpeech1.length, i + 48_000));
        sut.next(sample);
        active.push(sut.isActive() ? 1 : 0)
    }

    expect(active.length).toBe(54);
    expect(active).toEqual([
        0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1
    ])
})

