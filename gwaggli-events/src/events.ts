import {PipelineEvents, PipelineEventType} from "./events/pipeline-events";
import {ClientEvents, ClientEventType} from "./events/client-events";
import {DomainEvents, DomainEventType} from "./events/domain-events";

export type GwaggliEvent = PipelineEvents | ClientEvents | DomainEvents

export interface BaseEvent {
    type: GwaggliEventType;
    timestamp: number;
    sid: string
    subsystem: Subsystem;
}

export type Subsystem = "pipeline" | "client" | "domain"

export type GwaggliEventType = PipelineEventType | ClientEventType | DomainEventType;

