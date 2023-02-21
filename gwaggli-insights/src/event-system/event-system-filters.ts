import {GwaggliEvent, GwaggliEventType, Subsystem} from "./events";

export const byType = (type: GwaggliEventType) => (event: GwaggliEvent) => event.type === type;

export const bySid = (sid: string) => (event: GwaggliEvent) => event.sid === sid;

export const bySubsystem = (subsystem: Subsystem) => (event: GwaggliEvent) => event.subsystem === subsystem;

export const any = () => (_: GwaggliEvent) => true;