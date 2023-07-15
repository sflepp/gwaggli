import {loaderByLocationType} from "./loader-factory";
import {DirectoryLoader} from "./loaders/directory-loader";

it('should return loader for fs-directory', () => {
    const result = loaderByLocationType('fs/directory')

    expect(result).toBeInstanceOf(DirectoryLoader)
})