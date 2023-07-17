import { VoiceActivationAlgorithm } from './voice-activation-algorithm';
import { hasWaveHeader, WAV_HEADER_SIZE, WaveData, WavHeader } from '../../data/wave-data';

export interface SimplePcmVoiceActivationConfig {
    observeMilliseconds: number;
    observeSampleResolution: number;
    activationThreshold: number;
    deactivationThreshold: number;
}

export class SimplePcmVoiceActivation implements VoiceActivationAlgorithm {
    protected _header?: WavHeader = undefined;
    protected _buffer: Buffer = Buffer.alloc(0);
    protected _bufferMaxSize: number = 0;
    protected _activeBuffer?: Buffer = undefined;
    protected _currentLevel = 0;

    constructor(private readonly config: SimplePcmVoiceActivationConfig) {}

    private initializeWith(firstSample: Buffer) {
        if (!hasWaveHeader(firstSample)) {
            throw new Error('First sample must have WAVE/RIFF header information');
        }

        const waveData = new WaveData(firstSample);
        this._header = waveData.getHeader();
        this._bufferMaxSize =
            (this.config.observeMilliseconds / 1000) *
            this._header.sampleRate *
            this._header.channels *
            (this._header.bitsPerSample / 8);
    }

    next(sample: Buffer): WaveData | undefined {
        if (this._header === undefined) {
            this.initializeWith(sample);
        }

        if (this._header === undefined) {
            throw new Error('Header must be defined at this point');
        }

        const { activationThreshold, deactivationThreshold, observeSampleResolution } = this.config;

        const { bitsPerSample } = this._header;

        if (hasWaveHeader(sample)) {
            this._buffer = Buffer.concat([this._buffer, sample.subarray(WAV_HEADER_SIZE)]);
        } else {
            this._buffer = Buffer.concat([this._buffer, sample]);
        }

        this._buffer = this._buffer.subarray(Math.max(0, this._buffer.length - this._bufferMaxSize));

        if (this._buffer.length < this._bufferMaxSize) {
            // Not enough samples yet
            return undefined;
        }

        this._currentLevel = averageLevel(this._buffer, bitsPerSample, observeSampleResolution);

        if (!this._activeBuffer && this._currentLevel > activationThreshold) {
            // Was not active, but is now
            this._activeBuffer = this._buffer;
            return undefined;
        }

        if (this._activeBuffer && this._currentLevel > deactivationThreshold) {
            // Was active, and still is
            if (hasWaveHeader(sample)) {
                this._activeBuffer = Buffer.concat([this._activeBuffer, sample.subarray(WAV_HEADER_SIZE)]);
            } else {
                this._activeBuffer = Buffer.concat([this._activeBuffer, sample]);
            }
            return undefined;
        }

        if (this._activeBuffer && this._currentLevel < deactivationThreshold) {
            // Was active, but is not anymore
            const result = new WaveData(this._activeBuffer, {
                ...this._header,
                chunkSize: this._activeBuffer.length,
            });
            this._activeBuffer = undefined;
            return result;
        }
    }

    currentLevel(): number {
        return this._currentLevel;
    }

    isActive(): boolean {
        return this._activeBuffer !== undefined;
    }
}

export const averageLevel = (buffer: Buffer, bitsPerSample: number, resolution: number): number => {
    const lookAtEveryNthSample = Math.ceil((buffer.length / resolution / bitsPerSample) * 8);
    const dataView = new DataView(buffer.buffer);
    const getUint = getUintN(dataView, bitsPerSample);

    let total: bigint = BigInt(0);
    let count: bigint = BigInt(0);

    for (let i = 0; i < buffer.length - bitsPerSample; i += (bitsPerSample / 8) * lookAtEveryNthSample) {
        total += BigInt(getUint.call(dataView, i, true));
        count++;
    }

    return Number(total / count);
};

const getUintN = (dataView: DataView, bitsPerSample: number) => {
    switch (bitsPerSample) {
        case 8:
            return dataView.getUint8;
        case 16:
            return dataView.getUint16;
        case 32:
            return dataView.getUint32;
        default:
            throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
    }
};
