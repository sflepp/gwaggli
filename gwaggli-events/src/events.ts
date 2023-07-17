export interface BaseGwaggliEvent {
    type: GwaggliEventType;
    timestamp: number;
    sid?: string;
}

export enum GwaggliEventType {
    AudioChunk = 'audio-chunk',
    ClientViewUpdate = 'client-view-update',
    ClientViewVoiceActivation = 'client-view-voice-activation',
    JoinAdvisory = 'join-advisory',
    AddAdvisor = 'add-advisor',
    AdvisorAnswer = 'advisor-answer',
    VoiceActivationLevelUpdate = 'voice-activation-level-update',
    VoiceActivationStart = 'voice-activation-start',
    VoiceActivationEnd = 'voice-activation-end',
    VoiceActivationDataAvailable = 'voice-active-data-available',
    VoiceActivationPersist = 'voice-activation-persist',
    TranscriptionProcessing = 'transcription-processing',
    TranscriptionComplete = 'transcription-complete',
    CopilotProcessingComplete = 'copilot-processing-complete',
    TextCompletionFinish = 'text-completion-finish',
    TextToVoiceFinish = 'text-to-voice-finish',
    VoicePersist = 'voice-persist',
    KnowledgeLocationAvailable = 'knowledge-location-available',
    KnowledgeTextAvailable = 'knowledge-text-available',
    KnowledgeEmbeddingAvailable = 'knowledge-embedding-available',
    PipelineError = 'pipeline-error',
}

export type GwaggliEvent =
    | AudioChunk
    | ClientViewUpdate
    | ClientViewVoiceActivation
    | JoinAdvisoryEvent
    | AddAdvisorEvent
    | AdvisorAnswerEvent
    | VoiceActivationLevelUpdate
    | VoiceActivationStart
    | VoiceActivationEnd
    | VoiceActivationDataAvailable
    | VoiceActivationPersist
    | TranscriptionProcessing
    | TranscriptionComplete
    | TextCompletionFinish
    | CopilotProcessingComplete
    | TextToVoiceFinish
    | VoicePersist
    | KnowledgeLocationAvailable
    | KnowledgeTextAvailable
    | KnowledgeEmbeddingAvailable
    | PipelineError;

export interface AudioChunk extends BaseGwaggliEvent {
    type: GwaggliEventType.AudioChunk;
    audio: string;
}

export interface ClientViewUpdate extends BaseGwaggliEvent {
    type: GwaggliEventType.ClientViewUpdate;
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

export interface ClientViewVoiceActivation extends BaseGwaggliEvent {
    type: GwaggliEventType.ClientViewVoiceActivation;
    level: number;
}

export interface JoinAdvisoryEvent extends BaseGwaggliEvent {
    type: GwaggliEventType.JoinAdvisory;
    advisoryId: string;
}

export interface AddAdvisorEvent extends BaseGwaggliEvent {
    type: GwaggliEventType.AddAdvisor;
    advisorId: string;
    name: string;
    voice: string;
    purpose: string;
}

export interface AdvisorAnswerEvent extends BaseGwaggliEvent {
    type: GwaggliEventType.AdvisorAnswer;
    advisorId: string;
    text: string;
    audio: string;
    audioType: 'audio/wav' | 'audio/mpeg';
}

export interface VoiceActivationLevelUpdate extends BaseGwaggliEvent {
    type: GwaggliEventType.VoiceActivationLevelUpdate;
    level: number;
}

export interface VoiceActivationStart extends BaseGwaggliEvent {
    type: GwaggliEventType.VoiceActivationStart;
    trackId: string;
}

export interface VoiceActivationEnd extends BaseGwaggliEvent {
    type: GwaggliEventType.VoiceActivationEnd;
    trackId: string;
}

export interface VoiceActivationDataAvailable extends BaseGwaggliEvent {
    type: GwaggliEventType.VoiceActivationDataAvailable;
    trackId: string;
    audio: string;
}

export interface VoiceActivationPersist extends BaseGwaggliEvent {
    type: GwaggliEventType.VoiceActivationPersist;
    trackId: string;
    fileName: string;
}

export interface TranscriptionProcessing extends BaseGwaggliEvent {
    type: GwaggliEventType.TranscriptionProcessing;
    trackId: string;
    status: string;
}

export interface TranscriptionComplete extends BaseGwaggliEvent {
    type: GwaggliEventType.TranscriptionComplete;
    trackId: string;
    language: string;
    text: string;
}

export interface TextCompletionFinish extends BaseGwaggliEvent {
    type: GwaggliEventType.TextCompletionFinish;
    trackId: string;
    language: string;
    text: string;
}

export interface CopilotProcessingComplete extends BaseGwaggliEvent {
    type: GwaggliEventType.CopilotProcessingComplete;
    trackId: string;
    language: string;
    history: string;
    summary: string;
    facts: string;
    questions: string;
    buzzwords: string;
}

export interface TextToVoiceFinish extends BaseGwaggliEvent {
    type: GwaggliEventType.TextToVoiceFinish;
    trackId: string;
    audio: string;
    language: string;
    voiceId: string;
}

export interface VoicePersist extends BaseGwaggliEvent {
    type: GwaggliEventType.VoicePersist;
    trackId: string;
    fileName: string;
}

export interface PipelineError extends BaseGwaggliEvent {
    type: GwaggliEventType.PipelineError;
    error: string;
    cause: unknown;
}

export interface KnowledgeLocationAvailable extends BaseGwaggliEvent {
    type: GwaggliEventType.KnowledgeLocationAvailable;
    locationType: KnowledgeLocationType;
    location: string;
    data?: string;
}

export type KnowledgeLocationType = 'fs/directory' | 'inline/zip';

export interface KnowledgeTextAvailable extends BaseGwaggliEvent {
    type: GwaggliEventType.KnowledgeTextAvailable;
    source: string;
    text: string;
}

export interface KnowledgeEmbeddingAvailable extends BaseGwaggliEvent {
    type: GwaggliEventType.KnowledgeEmbeddingAvailable;
    source: string;
    text: string;
    embedding: number[];
}
