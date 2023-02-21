import {BaseEvent} from "../events";

export type PipelineEvents =
    AudioBufferUpdate |
    VoiceActivationLevelUpdate |
    VoiceActivationStart |
    VoiceActivationEnd |
    VoiceActivationDataAvailable |
    VoiceActivationPersist |
    TranscriptionComplete |
    TextCompletionFinish |
    TextToVoiceFinish |
    VoicePersist;

export enum PipelineEventType {
    AudioBufferUpdate = "audio-buffer-update",
    VoiceActivationLevelUpdate = "voice-activation-level-update",
    VoiceActivationStart = "voice-activation-start",
    VoiceActivationEnd = "voice-activation-end",
    VoiceActivationDataAvailable = "voice-active-data-available",
    VoiceActivationPersist = "voice-activation-persist",
    TranscriptionComplete = "transcription-complete",
    TextCompletionFinish = "text-completion-finish",
    TextToVoiceFinish = "text-to-voice-finish",
    VoicePersist = "voice-persist",
}

interface PipelineBaseEvent extends BaseEvent {
    subsystem: "pipeline"
}

export interface AudioBufferUpdate extends PipelineBaseEvent {
    type: PipelineEventType.AudioBufferUpdate,
    audio: string
}

export interface VoiceActivationLevelUpdate extends PipelineBaseEvent {
    type: PipelineEventType.VoiceActivationLevelUpdate,
    level: number
}

export interface VoiceActivationStart extends PipelineBaseEvent {
    type: PipelineEventType.VoiceActivationStart,
    trackId: string,
    startMarker: number,
}

export interface VoiceActivationEnd extends PipelineBaseEvent {
    type: PipelineEventType.VoiceActivationEnd,
    trackId: string,
    endMarker: number,
}

export interface VoiceActivationDataAvailable extends PipelineBaseEvent {
    type: PipelineEventType.VoiceActivationDataAvailable,
    trackId: string,
    audio: string,
}

export interface VoiceActivationPersist extends PipelineBaseEvent {
    type: PipelineEventType.VoiceActivationPersist,
    trackId: string,
    fileName: string,
}

export interface TranscriptionComplete extends PipelineBaseEvent {
    type: PipelineEventType.TranscriptionComplete,
    trackId: string,
    language: string,
    text: string,
}


export interface TextCompletionFinish extends PipelineBaseEvent {
    type: PipelineEventType.TextCompletionFinish,
    trackId: string,
    language: string,
    text: string,
}

export interface TextToVoiceFinish extends PipelineBaseEvent {
    type: PipelineEventType.TextToVoiceFinish,
    trackId: string,
    audio: string,
    language: string,
    voiceId: string,
}

export interface VoicePersist extends PipelineBaseEvent {
    type: PipelineEventType.VoicePersist,
    trackId: string,
    fileName: string,
}
