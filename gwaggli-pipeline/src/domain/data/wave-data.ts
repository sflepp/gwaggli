export const WAV_HEADER_SIZE = 44;

export interface WavHeader {
    sampleRate: number;
    mono: boolean;
    bitsPerSample: number;
    chunkSize?: number;
    channels: number;
}

export class WaveData {
    public readonly buffer: Buffer;

    constructor(buffer: Buffer, header?: WavHeader) {
        if (header) {
            const headerData = WaveData.createWavHeader(buffer, header.sampleRate, header.channels === 1, false);
            this.buffer = Buffer.concat([headerData, buffer]);
        } else {
            this.buffer = buffer;
        }
    }

    getBuffer(): Buffer {
        return this.buffer;
    }

    getHeader(): WavHeader {
        const header = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);

        return {
            chunkSize: header.getUint32(4, true),
            mono: header.getUint16(22, true) === 1,
            sampleRate: header.getUint32(24, true),
            bitsPerSample: header.getUint16(34, true),
            channels: header.getUint16(22, true),
        }
    }

    getPayload(): Buffer {
        return this.buffer.subarray(WAV_HEADER_SIZE);
    }

    merge(other: WaveData): WaveData {
        const newData = Buffer.concat([this.getPayload(), other.getPayload()]);
        const newHeader = WaveData.createWavHeader(newData, this.getHeader().sampleRate, this.getHeader().mono, false);
        return new WaveData(Buffer.concat([newHeader, newData]));
    }

    getLoudnessAt(time: number): number {
        const byteIndex = this.getByteIndexAtTime(time);
        const data = this.getPayload();
        const loudness = data.readInt16LE(byteIndex);
        return Math.abs(loudness);
    }

    getDuration(): number {
        const header = this.getHeader();
        return this.getPayload().length / (header.sampleRate * header.channels * (header.bitsPerSample / 8)) * 1000;
    }

    getByteIndexAtTime(time: number): number {
        const header = this.getHeader();
        const sampleRate = header.sampleRate;
        const channels = header.channels;
        const bitsPerSample = header.bitsPerSample;
        const bytesPerSample = bitsPerSample / 8;
        const bytesPerChannel = bytesPerSample * channels;
        const sampleIndex = Math.floor(time / 1000 * sampleRate);
        return Math.min(this.getPayload().length - bytesPerSample, sampleIndex * bytesPerChannel);
    }

    slice(startIndex: number, endIndex: number): WaveData {
        const data = this.getPayload();
        const newData = data.subarray(startIndex, endIndex);
        const newHeader = WaveData.createWavHeader(newData, this.getHeader().sampleRate, this.getHeader().mono, false);
        return new WaveData(Buffer.concat([newHeader, newData]));
    }

    static createWavHeader(data: Buffer, sampleRate: number, mono: boolean, streaming: boolean): Buffer {
        const header = new DataView(new ArrayBuffer(WAV_HEADER_SIZE));

        // http://soundfile.sapp.org/doc/WaveFormat/

        const writeString = (view: DataView, offset: number, string: string) => {
            string.split('').forEach((c, i) => {
                view.setUint8(offset + i, c.charCodeAt(0));
            });
        }

        // ChunkID
        writeString(header, 0, 'RIFF');
        // ChunkSize
        header.setUint32(4, streaming ? 0xffffffff : 32 + data.length, true);
        // Format
        writeString(header, 8, 'WAVE');
        // Subchunk1ID
        writeString(header, 12, 'fmt ');
        // Subchunk1Size
        header.setUint32(16, 16, true);
        // AudioFormat
        header.setUint16(20, 1, true);
        // NumChannels
        header.setUint16(22, mono ? 1 : 2, true);
        // SampleRate
        header.setUint32(24, sampleRate, true);
        // ByteRate
        header.setUint32(28, sampleRate * (mono ? 2 : 4), true);
        // BlockAlign
        header.setUint16(32, mono ? 2 : 4, true);
        // BitsPerSample
        header.setUint16(34, 16, true);
        // Subchunk2ID
        writeString(header, 36, 'data');
        // Subchunk2Size
        header.setUint32(40, data.length, true);

        return Buffer.from(header.buffer, header.byteOffset, header.byteLength);
    }
}