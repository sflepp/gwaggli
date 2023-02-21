import {GwaggliEvent, GwaggliEventType} from "./events";

const EventEmitter = require('events');

const eventSystem = new EventEmitter();
eventSystem.setMaxListeners(100)

export function filter<T = GwaggliEvent>(filter: (event: GwaggliEvent) => boolean, callback: (event: T) => void): (event: GwaggliEvent) => void {
    const listener = (event: GwaggliEvent) => {
        if (filter(event)) {
            callback(event as T);
        }
    }

    eventSystem.on("message", listener);

    return listener;
}

export function on<T extends GwaggliEvent>(type: GwaggliEventType, callback: (event: T) => void): (event: GwaggliEvent) => void {
    const listener = (event: GwaggliEvent) => {
        if (event.type === type) {
            callback(event as T);
        }
    }

    eventSystem.on("message", listener);

    return listener;
}

export function off(listener: (event: GwaggliEvent) => void) {
    eventSystem.off("message", listener);
}

export const dispatch = (event: GwaggliEvent) => {
    eventSystem.emit("message", event);
}