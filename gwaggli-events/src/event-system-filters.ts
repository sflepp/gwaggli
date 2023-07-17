import { GwaggliEvents, GwaggliEventType, Subsystem } from './events';
import { EventFilter } from './event-system';

export const byType =
    (type: GwaggliEventType): EventFilter =>
    (event: GwaggliEvents) =>
        event.type === type;

export const bySid =
    (sid: string): EventFilter =>
    (event: GwaggliEvents) =>
        event.sid === sid;

export const bySubsystem =
    (subsystem: Subsystem): EventFilter =>
    (event: GwaggliEvents) =>
        event.subsystem === subsystem;

export const none = (): EventFilter => () => true;
