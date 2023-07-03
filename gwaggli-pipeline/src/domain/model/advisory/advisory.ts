export interface Advisory {
    id: string;
    advisors: Advisor[]
    sids: string[]
    conversation: ConversationChunk[]
}

export interface Advisor {
    sid: string;
    id: string;
    name: string;
    voice: string;
    voiceSystem: 'aws-polly' | 'eleven-labs';
    purpose: string;
}

export interface ConversationChunk {
    from: string;
    to: string;
    text: string;
    language: string;
}

export interface AdvisorConfiguration {
    name: string;
    voiceSystem: 'aws-polly' | 'eleven-labs';
    voice: string;
    purpose: string;
}
