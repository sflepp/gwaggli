import {EventEmitter} from "events";
import {GwaggliEvent, GwaggliEventType} from "./events";

export class EventSystem {
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(100)
    }

    dispatch = (event: GwaggliEvent) => {
        this.eventEmitter.emit("message", event);
    }

    on<T extends GwaggliEvent>(type: GwaggliEventType, callback: (event: T) => void): (event: GwaggliEvent) => void {
        const listener = (event: GwaggliEvent) => {
            if (event.type === type) {
                callback(event as T);
            }
        }

        this.eventEmitter.on("message", listener);

        return listener;
    }

    off(listener: (event: GwaggliEvent) => void) {
        this.eventEmitter.off("message", listener);
    }

    filter<T = GwaggliEvent>(filter: (event: GwaggliEvent) => boolean, callback: (event: T) => void): (event: GwaggliEvent) => void {
        const listener = (event: GwaggliEvent) => {
            if (filter(event)) {
                callback(event as T);
            }
        }

        this.eventEmitter.on("message", listener);

        return listener;
    }

    connect(other: EventSystem) {
        other.eventEmitter.on("message", this.dispatch);
    }
}

const globalEventSystem = new EventSystem();
export const getGlobalEventSystem = () => globalEventSystem;