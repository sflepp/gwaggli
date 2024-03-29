import { TextPlain } from './parsers/text-plain';
import { ApplicationPdf } from './parsers/application-pdf';
import { Parser } from './parser';

import mime from 'mime-types';

export const parserByFileName = (fileName: string): Parser | undefined => {
    const mimeType = mime.lookup(fileName);

    if (!mimeType) {
        return undefined;
    }

    const parser = parserByMimeType(mimeType);

    if (parser === undefined) {
        console.warn(`No parser found for file name ${fileName}`);
    }

    return parser;
};

export const parserByMimeType = (mimeType: string): Parser | undefined => {
    switch (mimeType) {
        case 'text/plain':
            return new TextPlain();
        case 'application/pdf':
            return new ApplicationPdf();
        default:
            console.warn(`No parser found for mime type ${mimeType}`);
            return undefined;
    }
};
