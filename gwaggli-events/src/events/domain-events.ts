import {BaseEvent} from "../events";

export type DomainEvents = JoinAdvisoryEvent | AddAdvisorEvent | AdvisorAnswerEvent;

export enum DomainEventType {
    JoinAdvisory = "join-advisory",
    AddAdvisor = "add-advisor",
    AdvisorAnswer = "advisor-answer",
}

interface DomainBaseEvent extends BaseEvent {
    subsystem: "domain"
}

export interface RegisterPipeline extends DomainBaseEvent {
    pipeline: "chat" | "copilot" | "advisory"
}

export interface JoinAdvisoryEvent extends DomainBaseEvent {
    type: DomainEventType.JoinAdvisory,
    advisoryId: string,
}
export interface AddAdvisorEvent extends DomainBaseEvent {
    type: DomainEventType.AddAdvisor,
    advisorId: string,
    name: string,
    voice: string,
    purpose: string,
}

export interface AdvisorAnswerEvent extends DomainBaseEvent {
    type: DomainEventType.AdvisorAnswer,
    advisorId: string,
    text: string,
    audio: string,
    audioType: 'audio/wav' | 'audio/mpeg'
}
