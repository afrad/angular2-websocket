import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
export interface WebSocketConfig {
    initialTimeout: number;
    maxTimeout: number;
    reconnectIfNotNormalClose: boolean;
}
export declare class $WebSocket {
    private url;
    private protocols;
    private config;
    private reconnectAttempts;
    private sendQueue;
    private onOpenCallbacks;
    private onMessageCallbacks;
    private onErrorCallbacks;
    private onCloseCallbacks;
    private readyStateConstants;
    private normalCloseCode;
    private reconnectableStatusCodes;
    private socket;
    private internalConnectionState;
    constructor(url: string, protocols?: Array<string>, config?: WebSocketConfig);
    connect(force?: boolean): void;
    static create(url: string, protocols: Array<string>): WebSocket;
    onOpenHandler(event: Event): void;
    notifyOpenCallbacks(event: any): void;
    fireQueue(): void;
    notifyCloseCallbacks(event: any): void;
    notifyErrorCallbacks(event: any): void;
    onOpen(cb: any): this;
    onClose(cb: any): this;
    onError(cb: any): this;
    onMessage(callback: any, options: any): this;
    onMessageHandler(message: MessageEvent): void;
    onCloseHandler(event: CloseEvent): void;
    onErrorHandler(event: any): void;
    send(data: any): Observable<any>;
    reconnect(): this;
    close(force: boolean): this;
    getBackoffDelay(attempt: any): number;
    setInternalState(state: any): void;
    getReadyState(): number;
    setReadyState(): void;
    getDataStream(): Subject<any>;
}
