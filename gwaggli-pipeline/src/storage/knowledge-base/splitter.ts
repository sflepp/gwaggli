export abstract class Splitter {
    abstract name(): string;
    abstract split(text: string): string[];
}