import fs from 'fs';
import { InlineZipLoader } from './inline-zip-loader';

it('should load a zip file', async () => {
    const data = fs.readFileSync('./__test-data__/data-loader/zip/example-data-1.zip');

    const sut = new InlineZipLoader();

    const result = await sut.load({
        locationType: 'inline/zip',
        location: 'example-data-1.zip',
        data: data.toString('base64'),
    });

    expect(result.length).toBe(3);
    expect(result.find((it) => it.location === 'txt/rfc1149.txt')).not.toBeNull();
    expect(result.find((it) => it.location === 'txt/rfc2549.txt')).not.toBeNull();
    expect(result.find((it) => it.location === 'pdf/git.pdf')).not.toBeNull();
});
