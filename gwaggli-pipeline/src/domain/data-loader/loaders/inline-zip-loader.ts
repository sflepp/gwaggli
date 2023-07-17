import {Loader, LoaderRequest, LoaderResult} from "../loader";
import {parserByFileName} from "../parser-factory";
import {Duplex, Stream} from "stream";

import unzipper from "unzipper";

export class InlineZipLoader extends Loader {
    async load(event: LoaderRequest): Promise<LoaderResult[]> {
        if (!event.data) {
            return []
        }
        const zipData = Buffer.from(event.data, 'base64');
        const zipDataStream = bufferToStream(zipData);
        const directoryStream = zipDataStream.pipe(unzipper.Parse({forceStream: true}));

        const results: LoaderResult[] = [];

        for await (const entry of directoryStream) {
            const filename = entry.path;
            const type = entry.type;

            if (type === 'File') {
                const contents = await entry.buffer();
                const parser = parserByFileName(filename)

                if (parser === undefined) {
                    continue;
                }

                const result = await parser.parse(contents);

                results.push({
                    locationType: event.locationType,
                    location: filename,
                    text: result
                });
            } else {
                entry.autodrain();
            }
        }

        return results;
    }
}

const bufferToStream = (buffer: Buffer): Stream => {
    const tmp = new Duplex();
    tmp.push(buffer);
    tmp.push(null);
    return tmp;
}