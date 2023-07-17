import { GwaggliEvent, GwaggliEventType, Subsystem } from './events';
import { EventFilter } from './event-system';

export const byType =
    (type: GwaggliEventType): EventFilter =>
    (event: GwaggliEvent) =>
        event.type === type;

export const bySid =
    (sid: string): EventFilter =>
    (event: GwaggliEvent) =>
        event.sid === sid;

export const bySubsystem =
    (subsystem: Subsystem): EventFilter =>
    (event: GwaggliEvent) =>
        event.subsystem === subsystem;

export const none = (): EventFilter => () => true;
