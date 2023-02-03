const BUFFER_SIZE = 1_000_000; // 10 seconds

export interface AudioData {

    getConfig(): AudioDataConfig;

    write(data: Buffer): void;

    read(start: number, length: number): Buffer;

    readTail(length: number): Buffer;
    
    currentHead(): number;

    currentTail(): number;

    isClosed(): boolean;

    close(): void;

    averageLoudness(start: number, length: number, accuracy: number): number;
}

interface AudioDataConfig {
    
    mediaFormat: 'pcm';
    sampleRate: number;
    bytesPerSample: number;
    
    bufferSize?: number;
}

export class AudioDataRingBuffer implements AudioData {
    private config: AudioDataConfig;
    private readonly buffer: Buffer;
    private head = 0;
    private tail = 0;
    private closed = false;

    constructor(config: AudioDataConfig) {
        this.buffer = Buffer.alloc(config.bufferSize || BUFFER_SIZE);
        this.config = config;
    }

    getConfig(): AudioDataConfig {
        return this.config;
    }

    write(data: Buffer) {
        if (this.head % this.buffer.length + data.length > this.buffer.length) {
            // wrap around
            const firstChunk = this.buffer.length - this.head % this.buffer.length;
            const secondChunk = data.length - firstChunk;
            data.copy(this.buffer, this.head % this.buffer.length, 0, firstChunk);
            data.copy(this.buffer, 0, firstChunk, data.length);
        } else {
            data.copy(this.buffer, this.head % this.buffer.length);
        }
        
        this.head = this.head + data.length;
        this.tail = Math.max(0, this.head - this.buffer.length);
    }

    read(start: number, length: number): Buffer {
        
        const startOffset = start % this.buffer.length;
        
        if (start < this.tail) {
            throw new Error("Cannot read from before the tail");
        }
        
        if (start + length > this.head) {
            throw new Error("Cannot read past the head");
        }

        if (startOffset + length > this.buffer.length) {
            // wrap around
            const firstChunk = this.buffer.length - startOffset;
            const secondChunk = length - firstChunk;
            const result = Buffer.alloc(length);
            this.buffer.copy(result, 0, startOffset, startOffset + firstChunk);
            this.buffer.copy(result, firstChunk, 0, secondChunk);
            return result;
        } else {
            return this.buffer.slice(startOffset, startOffset + length);
        }
    }

    readTail(length: number): Buffer {
        return this.read(this.tail, length);
    }

    currentHead(): number {
        return this.head;
    }

    currentTail(): number {
        return this.tail;
    }

    isClosed(): boolean {
        return this.closed;
    }

    close() {
        this.closed = true;
    }

    averageLoudness(start: number, length: number, accuracy: number): number {
        const data = this.read(start, length);
        let sum = 0;
        let iterations = 0;
        
        let n = 2 * ((1 - accuracy) * 100)
        
        for (let i = 0; i < data.length; i += n) {
            sum += Math.abs(data.readInt16LE(i));
            iterations++;
        }
        
        const loudness = sum / iterations;
        
        return loudness;
    }
}
            

