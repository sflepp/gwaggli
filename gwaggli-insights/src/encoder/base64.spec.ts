import { encodeBase64 } from './base64';

it('should encode an ArrayBuffer to base64', () => {
    const testString = 'Hello, World!';

    const string = encodeBase64(stringToArrayBuffer(testString));

    expect(string).toEqual('SABlAGwAbABvACwAIABXAG8AcgBsAGQAIQA=');
    expect(atob(string)).toEqual(testString);
});

const stringToArrayBuffer = (value: string): ArrayBuffer => {
    const buffer = new ArrayBuffer(value.length * 2); // 2 bytes for each char
    const bufferView = new Uint16Array(buffer);
    const length = value.length;
    for (let i = 0; i < length; i++) {
        bufferView[i] = value.charCodeAt(i);
    }
    return buffer;
};
