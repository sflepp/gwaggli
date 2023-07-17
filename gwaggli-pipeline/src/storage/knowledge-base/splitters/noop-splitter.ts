import { Splitter } from '../splitter';

export class NoopSplitter extends Splitter {
    name(): string {
        return 'noop-splitter';
    }
    split(text: string): string[] {
        return [text];
    }
}
