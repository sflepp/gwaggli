import {TextPlain} from "./parsers/text-plain";
import {ApplicationPdf} from "./parsers/application-pdf";

const mime = require('mime-types')

export const parserByFileName = (fileName: string) => {
    return parserByMimeType(mime.lookup(fileName));
}

export const parserByMimeType = (mimeType: string) => {
    switch (mimeType) {
        case "text/plain":
            return new TextPlain();
        case "application/pdf":
            return new ApplicationPdf();
        default:
            throw new Error(`No parser found for mime type ${mimeType}`);
    }
}