const EventEmitter = require('events');

export interface DebugProgress {
    type: "progress"
    message: string
    data?: any
}

export interface CurrentLoudness {
    type: "current-loudness",
    loudness: number
}

export type ProgressEvent = DebugProgress | CurrentLoudness

export const reportEmitter = new EventEmitter();

export const report = (progressEvent: ProgressEvent) => {
    reportEmitter.emit("progress", progressEvent)
}

export const reportMessageProgress = (message: string) => {
    report({
        type: "progress",
        message: message
    });
}

export const reportCurrentLoudness = (loudness: number) => {
    report({
        type: "current-loudness",
        loudness: loudness
    })
}