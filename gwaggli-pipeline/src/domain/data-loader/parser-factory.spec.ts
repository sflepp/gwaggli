import { parserByFileName } from './parser-factory';
import { TextPlain } from './parsers/text-plain';
import { ApplicationPdf } from './parsers/application-pdf';

it('should return parser for text/plain', () => {
    const result = parserByFileName('test.txt');

    expect(result).toBeInstanceOf(TextPlain);
});
it('should return parser for application/pdf', () => {
    const result = parserByFileName('test.pdf');

    expect(result).toBeInstanceOf(ApplicationPdf);
});
it('should return parser even if full path is given', () => {
    const result = parserByFileName('some/path.to/some/file.pdf');

    expect(result).toBeInstanceOf(ApplicationPdf);
});
