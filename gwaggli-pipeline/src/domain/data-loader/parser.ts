export abstract class Parser {
    abstract parse(buffer: Buffer): Promise<string>;
}
