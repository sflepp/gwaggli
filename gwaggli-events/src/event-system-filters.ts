import { GwaggliEvent, GwaggliEventType } from './events';
import { EventFilter } from './event-system';

export const byType =
    (type: GwaggliEventType): EventFilter =>
    (event: GwaggliEvent) =>
        event.type === type;

export const bySid =
    (sid: string): EventFilter =>
    (event: GwaggliEvent) =>
        event.meta.sid === sid;
export const none = (): EventFilter => () => true;
