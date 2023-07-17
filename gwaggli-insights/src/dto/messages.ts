export type TransportMessage = AudioChunkMessage;

export interface AudioChunkMessage {
    type: 'audio-chunk';
    data: string; // base64
}

export interface TranscriptionMessage {
    type: 'transcription-event';
    data: string;
    transcript: string;
}
