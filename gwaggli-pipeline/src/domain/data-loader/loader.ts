export abstract class Loader {
    abstract load(event: LoaderRequest): Promise<LoaderResult[]>
}

export type LocationType = 'fs/directory'
export interface LoaderRequest {
    locationType: LocationType;
    location: string;
}
export interface LoaderResult {
    locationType: string,
    location: string,
    text: string,
}

