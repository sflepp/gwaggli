// https://github.com/hmontazeri/microphone/blob/master/src/encoders.js

// Encode a Float32Array of samples in WAV format.
//
// samples - A Float32Array of sound samples.
// opts    - An object of zero or more of the following options:
//           addHeader  - Boolean indicating whether to encode the WAV header at
//                        the beginning of the output (default: true).
//           streaming  - Boolean indicating whether the WAV file is being
//                        streamed. When true the ChunkSize and Subchunk2Size
//                        fields get set to 0xffffffff since we don't know the
//                        final size of the data.
//           sampleRate - Number indicating the sample rate of the provided
//                        samples.
//           mono       - Boolean indicating whether the provided samples
//                        have one or two channels of data.
//
// Returns a Blob of type audio/wav.
export function encodeWAV(samples: Float32Array, { streaming = false, sampleRate = 16000, mono = true } = {}): Blob {
    // http://soundfile.sapp.org/doc/WaveFormat/
    const header = new DataView(new ArrayBuffer(44));

    // ChunkID
    writeString(header, 0, 'RIFF');
    // ChunkSize
    header.setUint32(4, streaming ? 0xffffffff : 32 + samples.length * 2, true);
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
    header.setUint32(40, streaming ? 0xffffffff : samples.length * 2, true);

    const data = toPCM(samples);

    return new Blob([header, data], { type: 'audio/wav' });
}

const toPCM = (samples: Float32Array): DataView => {
    const view = new DataView(new ArrayBuffer(samples.length * 2));

    samples.forEach((s, i) => {
        const clamped = Math.max(-1, Math.min(1, s));
        view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    });

    return view;
};

function writeString(view: DataView, offset: number, string: string) {
    string.split('').forEach((c, i) => {
        view.setUint8(offset + i, c.charCodeAt(0));
    });
}
