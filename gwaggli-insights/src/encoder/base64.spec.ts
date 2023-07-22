import { encodeBase64 } from './base64';

it('should encode an ArrayBuffer to base64', () => {
    const testString = 'Hello, World!';

    const string = encodeBase64(stringToArrayBuffer(testString));

    expect(string).toEqual('SGVsbG8sIFdvcmxkIQ==');
    expect(atob(string)).toEqual(testString);
});

const stringToArrayBuffer = (value: string): ArrayBuffer => {
    const buffer = new ArrayBuffer(value.length);
    const bufferView = new Uint8Array(buffer);
    const length = value.length;
    for (let i = 0; i < length; i++) {
        bufferView[i] = value.charCodeAt(i);
    }
    return buffer;
};
