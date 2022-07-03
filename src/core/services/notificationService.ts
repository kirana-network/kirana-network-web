import { Stream } from "stream";
import { getLoggingInstance } from "../utils/logger";

export type NotificationEvent = "GPS_LOCATION_UPDATE" | "CONNECTION_STATUS_UPDATE";
export type WebSocketEvent = {
    action: NotificationEvent,
    body: any
}

export interface NotificationService {
    connect: (token: string) => void;
    connectTrip: (tripId: string) => void;
    disconnect: () => void;
    isConnected(): boolean;
    listen: (eventName: NotificationEvent, listener: (args: any) => void) => void;
    removeListener: (eventName: NotificationEvent, listener: (args: any) => void) => void;
    sendMessage: (message: any) => void;
}

export class NotificationServiceImpl implements NotificationService {
    socket: WebSocket;
    eventStream: Stream;
    onSocketConnectedFunctions: Function[] = [];
    constructor() {
        this.eventStream = new Stream();
    }

    private async initializeSocket() {
        logger.trace("initializeSocket")
        this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_ENDPOINT!);
        return new Promise((resolve) => {
            this.socket.onopen = (event: Event) => {
                logger.trace("onopen", { event, socket: this.socket });
                this.emitEvent({ action: "CONNECTION_STATUS_UPDATE", body: true });
                this.onSocketConnectedFunctions.forEach(f => f());
                this.onSocketConnectedFunctions = [];
                return resolve({});
            };
            this.socket.onmessage = (event: MessageEvent) => {
                this.emitEvent(JSON.parse(event.data).message);
            }
            this.socket.onclose = (event: Event) => {
                logger.trace("onclose", {event});
                this.emitEvent({ action: "CONNECTION_STATUS_UPDATE", body: false });
            }
            this.socket.onerror = (error: any) => {
                logger.error("onerror", { error });
            }
        });
    }

    async sendMessage(message: any) {
        logger.trace("sendMessage", { message, socket: this.socket });
        if (!this.socket || (this.socket.readyState !== this.socket.OPEN && this.socket.readyState !== this.socket.CONNECTING)) {
            this.onSocketConnectedFunctions.push(() => this.socket.send(JSON.stringify(message)));
            await this.initializeSocket();
            logger.trace("initialized", { readyState: this.socket.readyState });
        }
        else if (this.socket && (this.socket.readyState === this.socket.CONNECTING)) {
            logger.trace("still connecting so we'll add this to the onConnectedFunctions callback list");
            this.onSocketConnectedFunctions.push(() => this.socket.send(JSON.stringify(message)));
        }
        else {
            this.socket.send(JSON.stringify(message))
        }
    }
    connect(token: string) {
        this.sendMessage({
            body: token, action: "REGISTER_CONNECTION"
        });
    }
    connectTrip(tripId: string) {
        this.sendMessage({
            body: tripId, action: "REGISTER_TRIP_CONNECTION"
        });
    }
    disconnect() {
        this.socket && this.socket.close();
    }

    private emitEvent(event: WebSocketEvent) {
        this.eventStream.emit(event.action, event.body);
    }

    listen(eventName: NotificationEvent, listener: (args: any) => void) {
        this.eventStream.on(eventName, listener);
    }

    removeListener(eventName: NotificationEvent, listener: (args: any) => void) {
        this.eventStream.removeListener(eventName, listener);
    }

    isConnected() {
        return this.socket && this.socket.readyState === this.socket.OPEN;
    }
}
const logger = getLoggingInstance(NotificationServiceImpl.name);