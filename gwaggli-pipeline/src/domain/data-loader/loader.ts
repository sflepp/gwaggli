export abstract class Loader {
    abstract load(event: LoaderRequest): Promise<LoaderResult[]>;
}

export type LocationType = 'fs/directory' | 'inline/zip';
export interface LoaderRequest {
    locationType: LocationType;
    location: string;
    data?: string;
}
export interface LoaderResult {
    locationType: string;
    location: string;
    text: string;
}
