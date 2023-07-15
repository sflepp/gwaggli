import {BaseEvent} from "../events";


export type PipelineEvents =
    AudioBufferUpdate |
    VoiceActivationLevelUpdate |
    VoiceActivationStart |
    VoiceActivationEnd |
    VoiceActivationDataAvailable |
    VoiceActivationPersist |
    TranscriptionProcessing |
    TranscriptionComplete |
    TextCompletionFinish |
    CopilotProcessingComplete |
    TextToVoiceFinish |
    VoicePersist |
    KnowledgeLocationAvailable |
    KnowledgeTextAvailable |
    KnowledgeEmbeddingAvailable |
    PipelineError;

export enum PipelineEventType {
    AudioBufferUpdate = "audio-buffer-update",
    VoiceActivationLevelUpdate = "voice-activation-level-update",
    VoiceActivationStart = "voice-activation-start",
    VoiceActivationEnd = "voice-activation-end",
    VoiceActivationDataAvailable = "voice-active-data-available",
    VoiceActivationPersist = "voice-activation-persist",
    TranscriptionProcessing = "transcription-processing",
    TranscriptionComplete = "transcription-complete",
    CopilotProcessingComplete = "copilot-processing-complete",
    TextCompletionFinish = "text-completion-finish",
    TextToVoiceFinish = "text-to-voice-finish",
    VoicePersist = "voice-persist",
    KnowledgeLocationAvailable = "knowledge-location-available",
    KnowledgeTextAvailable = "knowledge-text-available",
    KnowledgeEmbeddingAvailable = "knowledge-embedding-available",
    PipelineError = "pipeline-error",
}

interface PipelineBaseEvent extends BaseEvent {
    subsystem: "pipeline"
}

export interface AudioBufferUpdate extends PipelineBaseEvent {
    type: PipelineEventType.AudioBufferUpdate,
    audio: any
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

export interface TranscriptionProcessing extends PipelineBaseEvent {
    type: PipelineEventType.TranscriptionProcessing,
    trackId: string,
    status: string
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

export interface CopilotProcessingComplete extends PipelineBaseEvent {
    type: PipelineEventType.CopilotProcessingComplete,
    trackId: string,
    language: string,
    history: string,
    summary: string,
    facts: string,
    questions: string,
    buzzwords: string,
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

export interface PipelineError extends PipelineBaseEvent {
    type: PipelineEventType.PipelineError,
    error: string
    cause: any
}

export interface KnowledgeLocationAvailable extends PipelineBaseEvent {
    type: PipelineEventType.KnowledgeLocationAvailable,
    locationType: KnowledgeLocationType,
    location: string,
    data?: string,
}

export type KnowledgeLocationType = 'fs/directory' | 'inline/zip'

export interface KnowledgeTextAvailable extends PipelineBaseEvent {
    type: PipelineEventType.KnowledgeTextAvailable,
    source: string
    text: string
}

export interface KnowledgeEmbeddingAvailable extends PipelineBaseEvent {
    type: PipelineEventType.KnowledgeEmbeddingAvailable,
    source: string
    text: string
    embedding: number[]
}

