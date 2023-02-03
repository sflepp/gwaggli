import {AudioDataRingBuffer} from "./audio-data";

describe("AudioData", () => {
    it("should write buffer", () => {
        const buffer = new Buffer(160);
        buffer.fill(111);

        const audioStream = new AudioDataRingBuffer({
            sampleRate: 16_000,
            bytesPerSample: 2,
            mediaFormat: 'pcm'
        });

        audioStream.write(buffer);

        expect(audioStream.currentHead()).toBe(160)
        expect(audioStream.currentTail()).toBe(0)
    });

    it("should write buffer twice", () => {
        const buffer = new Buffer(160);
        buffer.fill(111);

        const audioStream = new AudioDataRingBuffer({
            sampleRate: 16_000,
            bytesPerSample: 2,
            mediaFormat: 'pcm'
        });

        audioStream.write(buffer);
        audioStream.write(buffer);

        expect(audioStream.currentHead()).toBe(320)
        expect(audioStream.currentTail()).toBe(0)
    });

    it("should write buffer twice and read", () => {
        const buffer = new Buffer(160);
        buffer.fill(111);

        const audioStream = new AudioDataRingBuffer({
            sampleRate: 16_000,
            bytesPerSample: 2,
            mediaFormat: 'pcm'
        });

        audioStream.write(buffer);
        audioStream.write(buffer);

        const readBuffer = audioStream.read(0, 320);

        for (let i = 0; i < readBuffer.length; i++) {
            expect(readBuffer[i]).toBe(111)
        }
    });

    it("should write buffer twice and read tail", () => {
        const buffer = new Buffer(160);
        buffer.fill(111);

        const audioStream = new AudioDataRingBuffer({
            sampleRate: 16_000,
            bytesPerSample: 2,
            mediaFormat: 'pcm'
        });

        audioStream.write(buffer);
        audioStream.write(buffer);

        const readBuffer = audioStream.readTail(320);

        for (let i = 0; i < readBuffer.length; i++) {
            expect(readBuffer[i]).toBe(111)
        }
    });

    it("should write more than buffer size", () => {
        const audioStream = new AudioDataRingBuffer({
            sampleRate: 1_000,
            bytesPerSample: 2,
            bufferSize: 20,
            mediaFormat: 'pcm'
        });

        const buffer1 = new Buffer(10);
        buffer1.fill(1);
        audioStream.write(buffer1);

        const buffer2 = new Buffer(10);
        buffer2.fill(2);
        audioStream.write(buffer2);

        const buffer3 = new Buffer(10);
        buffer3.fill(3);
        audioStream.write(buffer3);

        expect(audioStream.currentHead()).toBe(30)
        expect(audioStream.currentTail()).toBe(10)

        const readBuffer = audioStream.read(10, 20);

        for (let i = 0; i < 10; i++) {
            expect(readBuffer[i]).toBe(2)
        }

        for (let i = 10; i < 20; i++) {
            expect(readBuffer[i]).toBe(3)
        }
    });
    
    fit("should write more than buffer size and overlap", () => {
        const audioStream = new AudioDataRingBuffer({
            sampleRate: 1_000,
            bytesPerSample: 2,
            bufferSize: 20,
            mediaFormat: 'pcm'
        });

        const buffer1 = new Buffer(15);
        buffer1.fill(1);
        audioStream.write(buffer1);

        const buffer2 = new Buffer(10);
        buffer2.fill(2);
        audioStream.write(buffer2);
        

        expect(audioStream.currentHead()).toBe(25)
        expect(audioStream.currentTail()).toBe(5)

        const readBuffer = audioStream.read(5, 20);

        for (let i = 0; i < 10; i++) {
            expect(readBuffer[i]).toBe(1)
        }

        for (let i = 10; i < 10; i++) {
            expect(readBuffer[i]).toBe(2)
        }
    });
});