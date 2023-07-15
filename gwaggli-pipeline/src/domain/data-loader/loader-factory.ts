import {DirectoryLoader} from "./loaders/directory-loader";
import {Loader, LocationType} from "./loader";
import {InlineZipLoader} from "./loaders/inline-zip-loader";


export const loaderByLocationType = (locationType: LocationType): Loader => {
    switch (locationType) {
        case "fs/directory":
            return new DirectoryLoader();
        case "inline/zip":
            return new InlineZipLoader();
        default:
            throw new Error(`No loader found for location type ${locationType}`);
    }
}
