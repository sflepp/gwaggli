import { BaseEvent } from '../events';

export type ClientEvents = AudioChunk | ClientViewUpdate | ClientViewVoiceActivation;

export enum ClientEventType {
    AudioChunk = 'audio-chunk',
    ClientViewUpdate = 'client-view-update',
    ClientViewVoiceActivation = 'client-view-voice-activation',
}

interface ClientBaseEvent extends BaseEvent {
    subsystem: 'client';
}

export interface AudioChunk extends ClientBaseEvent {
    type: ClientEventType.AudioChunk;
    audio: string;
}

export interface ClientViewUpdate extends ClientBaseEvent {
    type: ClientEventType.ClientViewUpdate;
    data: ClientViewState;
}

export interface ClientViewState {
    sid: string;
    conversation: ConversationChunk[];
}

export interface ConversationChunk {
    id: string;
    timestamp: number;
    currentStep: string;
    voiceActivationActive: boolean;
    promptLanguage?: string;
    prompt?: string;
    answerLanguage?: string;
    answer?: string;
    answerAudioUrl?: string;
}

export interface ClientViewVoiceActivation extends ClientBaseEvent {
    type: ClientEventType.ClientViewVoiceActivation;
    level: number;
}
