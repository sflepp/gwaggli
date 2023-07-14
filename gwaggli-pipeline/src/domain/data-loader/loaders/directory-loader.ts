import {Loader, LoaderRequest, LoaderResult} from "../loader";
import {parserByFileName} from "../parser-factory";

const fs = require("fs")

export class DirectoryLoader extends Loader {
    async load(event: LoaderRequest): Promise<LoaderResult[]> {
        const path = event.location;

        const files = listFiles(path);

        const results: LoaderResult[] = []

        for (const file of files) {
            const fileContents = fs.readFileSync(file);
            const parser = parserByFileName(file)

            const result = await parser.parse(fileContents);

            results.push({
                locationType: event.locationType,
                location: file,
                text: result
            })
        }

        return results;
    }
}

const listFiles = (directory: string, files: string[] = []) => {
    const currentFiles = fs.readdirSync(directory);

    for (const file of currentFiles) {
        const currentFile = `${directory}/${file}`

        if (fs.statSync(currentFile).isDirectory()) {
            listFiles(currentFile, files);
        } else {
            files.push(currentFile)
        }
    }

    return files;
}
