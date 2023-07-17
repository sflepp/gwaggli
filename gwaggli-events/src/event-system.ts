import { EventEmitter } from 'events';
import { GwaggliEvents, GwaggliEventType } from './events';

export class EventSystem {
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(100);
    }

    dispatch = (event: GwaggliEvents) => {
        this.eventEmitter.emit('message', event);
    };

    on<T extends GwaggliEvents>(type: GwaggliEventType, callback: (event: T) => void): (event: GwaggliEvents) => void {
        const listener = (event: GwaggliEvents) => {
            if (event.type === type) {
                console.log(`Processing ${event.type}...`);
                callback(event as T);
            }
        };

        this.eventEmitter.on('message', listener);

        return listener;
    }

    off(listener: (event: GwaggliEvents) => void) {
        this.eventEmitter.off('message', listener);
    }

    filter<T = GwaggliEvents>(filter: EventFilter, callback: (event: T) => void): (event: GwaggliEvents) => void {
        const listener = (event: GwaggliEvents) => {
            if (filter(event)) {
                callback(event as T);
            }
        };

        this.eventEmitter.on('message', listener);

        return listener;
    }

    await<T extends GwaggliEvents>(filter: EventFilter): Promise<T> {
        return new Promise<T>((resolve) => {
            const listener = (event: GwaggliEvents) => {
                if (filter(event)) {
                    resolve(event as T);
                    this.off(listener);
                }
            };

            this.eventEmitter.on('message', listener);
        });
    }

    awaitType<T extends GwaggliEvents>(type: GwaggliEventType): Promise<T> {
        return new Promise<T>((resolve) => {
            const listener = (event: GwaggliEvents) => {
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

export type EventFilter = (event: GwaggliEvents) => boolean;
