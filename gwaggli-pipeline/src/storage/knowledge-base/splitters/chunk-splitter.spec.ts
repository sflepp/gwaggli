import {ChunkSplitter} from "./chunk-splitter";
import fs from "fs";

it('should split a simple text into chunks with fixed size', () => {
    const sut = new ChunkSplitter(10);

    const result = sut.split("some text that is longer than 10 characters");

    expect(result.length).toBe(5);
    expect(result[0].length).toBe(10)
    expect(result).toEqual(["some text ", "that is lo", "nger than ", "10 charact", "ers"])
});

it('should split a more advanced text into chunks with fixed size', () => {
    const sut = new ChunkSplitter(250);

    const text = fs.readFileSync("./__test-data__/data-loader/txt/rfc1149.txt", 'utf8');

    const result = sut.split(text);

    expect(result.length).toBe(13);
    expect(result[0].length).toBe(250)
});

it('should return the text if the chunk size is bigger than the text', () => {
    const sut = new ChunkSplitter(1000);

    const result = sut.split("some text");

    expect(result.length).toBe(1);
    expect(result).toEqual(["some text"]);
});