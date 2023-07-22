import { EventEmitter } from 'events';
import { GwaggliEvent, GwaggliEventType, Metadata, WithoutMeta } from './events';
import { v4 as uuidv4 } from 'uuid';

export class EventSystem {
    private eventEmitter = new EventEmitter();

    constructor(private sid?: string) {
        this.eventEmitter.setMaxListeners(100);
    }

    dispatch = (event: GwaggliEvent) => {
        this.eventEmitter.emit('message', event);
    };

    on<T extends GwaggliEvent>(type: GwaggliEventType, callback: (event: T) => void): (event: GwaggliEvent) => void {
        const listener = (event: GwaggliEvent) => {
            if (event.type === type) {
                console.log(`Processing ${event.type}...`);
                callback(event as T);
            }
        };

        this.eventEmitter.on('message', listener);

        return listener;
    }

    off(listener: (event: GwaggliEvent) => void) {
        this.eventEmitter.off('message', listener);
    }

    filter<T = GwaggliEvent>(filter: EventFilter, callback: (event: T) => void): (event: GwaggliEvent) => void {
        const listener = (event: GwaggliEvent) => {
            if (filter(event)) {
                callback(event as T);
            }
        };

        this.eventEmitter.on('message', listener);

        return listener;
    }

    await<T extends GwaggliEvent>(filter: EventFilter): Promise<T> {
        return new Promise<T>((resolve) => {
            const listener = (event: GwaggliEvent) => {
                if (filter(event)) {
                    resolve(event as T);
                    this.off(listener);
                }
            };

            this.eventEmitter.on('message', listener);
        });
    }

    awaitType<T extends GwaggliEvent>(type: GwaggliEventType): Promise<T> {
        return new Promise<T>((resolve) => {
            const listener = (event: GwaggliEvent) => {
                if (event.type === type) {
                    resolve(event as T);
                    this.off(listener);
                }
            };

            this.eventEmitter.on('message', listener);
        });
    }

    connect(other: EventSystem) {
        other.eventEmitter.on('message', this.dispatch);
    }
}

const globalEventSystem = new EventSystem();
export const getGlobalEventSystem = () => globalEventSystem;

export type EventFilter = (event: GwaggliEvent) => boolean;

export const withTrace = (other: GwaggliEvent): Metadata => {
    const id = uuidv4();
    return {
        id: id,
        sid: other.meta.sid,
        tid: [...other.meta.tid, id],
        time: Date.now(),
    };
};

export const withSid = (sid: string): Metadata => {
    const id = uuidv4();
    return {
        id: id,
        sid: sid,
        tid: [id],
        time: Date.now(),
    };
};

export const dispatchWithoutMeta = (eventSystem: EventSystem, sid: string, event: WithoutMeta<GwaggliEvent>) => {
    eventSystem.dispatch({
        ...(event as GwaggliEvent),
        meta: withSid(sid),
    });
};
