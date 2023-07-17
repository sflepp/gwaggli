import { Parser } from '../parser';

export class TextPlain extends Parser {
    async parse(buffer: Buffer): Promise<string> {
        return buffer.toString('utf8');
    }
}
