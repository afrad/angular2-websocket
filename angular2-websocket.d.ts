import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
export declare class $WebSocket {
    private url;
    private protocols;
    private config;
    private binaryType;
    private static Helpers;
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
    private dataStream;
    private internalConnectionState;
    constructor(url: string, protocols?: Array<string>, config?: WebSocketConfig, binaryType?: BinaryType);
    connect(force?: boolean): void;
    /**
     * Run in Block Mode
     * Return true when can send and false in socket closed
     * @param data
     * @returns {boolean}
     */
    send4Direct(data: any, binary?: boolean): boolean;
    /**
     * Return Promise
     * When can Send will resolve Promise
     * When Socket closed will reject Promise
     * @param data
     * @returns {Promise<any>}
     */
    send4Promise(data: any, binary?: boolean): Promise<any>;
    /**
     * Return cold Observable
     * When can Send will complete observer
     * When Socket closed will error observer
     * @param data
     * @returns {Observable<any>}
     */
    send4Observable(data: any, binary?: boolean): Observable<any>;
    private send4Mode;
    /**
     * Set send(data) function return mode
     * @param mode
     */
    setSend4Mode(mode: WebSocketSendMode): void;
    /**
     * Use {mode} mode to send {data} data
     * If no specify, Default SendMode is Observable mode
     * @param data
     * @param mode
     * @param binary
     * @returns {any}
     */
    send(data: any, mode?: WebSocketSendMode, binary?: boolean): any;
    getDataStream(): Subject<any>;
    onOpenHandler(event: Event): void;
    notifyOpenCallbacks(event: any): void;
    fireQueue(): void;
    notifyCloseCallbacks(event: any): void;
    notifyErrorCallbacks(event: any): void;
    onOpen(cb: any): this;
    onClose(cb: any): this;
    onError(cb: any): this;
    onMessage(callback: any, options?: any): this;
    onMessageHandler(message: MessageEvent): void;
    onCloseHandler(event: CloseEvent): void;
    onErrorHandler(event: any): void;
    reconnect(): this;
    close(force?: boolean): this;
    getBackoffDelay(attempt: any): number;
    setInternalState(state: any): void;
    /**
     * Could be -1 if not initzialized yet
     * @returns {number}
     */
    getReadyState(): number;
}
export interface WebSocketConfig {
    initialTimeout: number;
    maxTimeout: number;
    reconnectIfNotNormalClose: boolean;
}
export declare enum WebSocketSendMode {
    Direct = 0,
    Promise = 1,
    Observable = 2,
}
export declare type BinaryType = "blob" | "arraybuffer";
