import {PipelineEvents, PipelineEventType} from "./events/pipeline-events";
import {ClientEvents, ClientEventType} from "./events/client-events";

export type GwaggliEvent = PipelineEvents | ClientEvents

export interface BaseEvent {
    type: GwaggliEventType;
    timestamp: number;
    sid: string
    subsystem: Subsystem;
}

export type Subsystem = "pipeline" | "client";

export type GwaggliEventType = PipelineEventType | ClientEventType;

