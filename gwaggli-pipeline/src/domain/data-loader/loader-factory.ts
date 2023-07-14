import {DirectoryLoader} from "./loaders/directory-loader";
import {Loader, LocationType} from "./loader";

export const loaderByLocationType = (locationType: LocationType): Loader => {
    switch (locationType) {
        case "fs/directory":
            return new DirectoryLoader();
        default:
            throw new Error(`No loader found for location type ${locationType}`);
    }
}
