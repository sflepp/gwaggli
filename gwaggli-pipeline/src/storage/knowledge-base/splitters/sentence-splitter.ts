import {Splitter} from "../splitter";

/**
 * Splits the given text into sentences.
 */
export class SentenceSplitter extends Splitter {
    name(): string {
        return "sentence-splitter";
    }
    split(text: string): string[] {
        return text.split(".")
    }
}