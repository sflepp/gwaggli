import { NoopSplitter } from './noop-splitter';
import fs from 'fs';

it('should not split simple text', () => {
    const sut = new NoopSplitter();

    const result = sut.split('some text');

    expect(result.length).toBe(1);
    expect(result).toEqual(['some text']);
});

it('should not split more complex text', () => {
    const sut = new NoopSplitter();
    const text = fs.readFileSync('./__test-data__/data-loader/txt/rfc1149.txt', 'utf8');

    const result = sut.split(text);

    expect(result.length).toBe(1);
    expect(result).toEqual([text]);
});
