import { Splitter } from '../splitter';

/**
 * This splitter splits the text into fixed length chunks with an overlap.
 */
export class ChunkSplitter extends Splitter {
    constructor(private n: number) {
        super();
    }

    name(): string {
        return 'fixed-length-splitter';
    }

    split(text: string): string[] {
        const chunks: string[] = [];

        let i = 0;
        while (i < text.length) {
            chunks.push(text.substring(i, i + this.n));
            i += this.n;
        }

        return chunks;
    }
}
