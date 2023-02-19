

export type TransportMessage = AudioChunkMessage;

export interface AudioChunkMessage {
    type: 'audio-chunk';
    data: string; // base64
}

export interface CharacterAnswerMessage {
    type: 'character-answer';
    data: string;
    transcript: string
}