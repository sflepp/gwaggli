import {Parser} from "../parser";
import pdf from "pdf-parse";

export class ApplicationPdf extends Parser {
    async parse(buffer: Buffer): Promise<string> {
        const data = await pdf(buffer);
        return data.text;
    }
}