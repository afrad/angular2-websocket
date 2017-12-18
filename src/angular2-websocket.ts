import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export class $WebSocket {

    private static Helpers = class {
        static isPresent(obj: any): boolean {
            return obj !== undefined && obj !== null;
        }

        static isString(obj: any): boolean {
            return typeof obj === 'string';
        }

        static isArray(obj: any): boolean {
            return Array.isArray(obj);
        }

        static isFunction(obj: any): boolean {
            return typeof obj === 'function';
        }
    };

    private reconnectAttempts = 0;
    private sendQueue = [];
    private onOpenCallbacks = [];
    private onMessageCallbacks = [];
    private onErrorCallbacks = [];
    private onCloseCallbacks = [];
    private readyStateConstants = {
        'UNINITIALIZED': -1,
        'CONNECTING': 0,
        'OPEN': 1,
        'CLOSING': 2,
        'CLOSED': 3,
        'RECONNECT_ABORTED': 4
    };
    private normalCloseCode = 1000;
    private reconnectableStatusCodes = [4000];
    private socket: WebSocket;
    private dataStream: Subject<any>;
    private errorMessages: Subject<any>;
    private internalConnectionState: number;

    constructor(private url: string, 
        private protocols?: Array<string>, 
        private config?: WebSocketConfig, 
        private binaryType?: BinaryType) 
    {
        let match = new RegExp('wss?:\/\/').test(url);
        if (!match) {
            throw new Error('Invalid url provided');
        }
        this.config = Object.assign({ initialTimeout: 500, maxTimeout: 300000, reconnectIfNotNormalClose: false }, config);
        this.binaryType = binaryType || "blob";
        this.dataStream = new Subject();
        this.errorMessages = new Subject();
        this.connect(true);
    }

    connect(force = false) {
        // console.log("WebSocket connecting...");
        let self = this;
        if (force || !this.socket || this.socket.readyState !== this.readyStateConstants.OPEN) {
            self.socket = this.protocols ? new WebSocket(this.url, this.protocols) : new WebSocket(this.url);
            self.socket.binaryType = self.binaryType.toString();

            self.socket.onopen = (ev: Event) => {
                // console.log('onOpen: ', ev);
                this.onOpenHandler(ev);
            };
            self.socket.onmessage = (ev: MessageEvent) => {
                // console.log('onNext: ', ev.data);
                self.onMessageHandler(ev);
                this.dataStream.next(ev);
            };
            this.socket.onclose = (ev: CloseEvent) => {
                // console.log('onClose ', ev);
                self.onCloseHandler(ev);
            };

            this.socket.onerror = (ev: ErrorEvent) => {
                // console.log('onError ', ev);
                self.onErrorHandler(ev);
                this.errorMessages.next(ev);
            };

        }
    }

    getErrorStream(): Subject<any> {
        return this.errorMessages;
    }

    /**
     * Run in Block Mode
     * Return true when can send and false in socket closed
     * @param data
     * @returns {boolean}
     */
    send4Direct(data, binary?: boolean): boolean {
        let self = this;
        if (this.getReadyState() !== this.readyStateConstants.OPEN
               && this.getReadyState() !== this.readyStateConstants.CONNECTING) {
            this.connect();
        }
        self.sendQueue.push({message: data, binary: binary});
        if (self.socket.readyState === self.readyStateConstants.OPEN) {
            self.fireQueue();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Return Promise
     * When can Send will resolve Promise
     * When Socket closed will reject Promise
     * @param data
     * @returns {Promise<any>}
     */
    send4Promise(data, binary?: boolean): Promise<any> {
        return new Promise(
               (resolve, reject) => {
                   if (this.send4Direct(data, binary)) {
                       return resolve();
                   } else {
                       return reject(Error('Socket connection has been closed'));
                   }
               }
        )
    }

    /**
     * Return cold Observable
     * When can Send will complete observer
     * When Socket closed will error observer
     * @param data
     * @returns {Observable<any>}
     */
    send4Observable(data, binary?: boolean): Observable<any> {
        return Observable.create((observer) => {
            if (this.send4Direct(data, binary)) {
                return observer.complete();
            } else {
                return observer.error('Socket connection has been closed');
            }
        });
    }

    private send4Mode: WebSocketSendMode = WebSocketSendMode.Observable;

    /**
     * Set send(data) function return mode
     * @param mode
     */
    setSend4Mode(mode: WebSocketSendMode): void {
        this.send4Mode = mode;
    }

    /**
     * Use {mode} mode to send {data} data
     * If no specify, Default SendMode is Observable mode
     * @param data
     * @param mode
     * @param binary
     * @returns {any}
     */
    send(data: any, mode?: WebSocketSendMode, binary?: boolean): any {
        switch (typeof mode !== "undefined" ? mode : this.send4Mode) {
            case WebSocketSendMode.Direct:
                return this.send4Direct(data, binary);
            case WebSocketSendMode.Promise:
                return this.send4Promise(data, binary);
            case WebSocketSendMode.Observable:
                return this.send4Observable(data, binary);
            default:
                throw Error("WebSocketSendMode Error.");
        }
    }

    getDataStream(): Subject<any> {
        return this.dataStream;
    }

    onOpenHandler(event: Event) {
        this.reconnectAttempts = 0;
        this.notifyOpenCallbacks(event);
        this.fireQueue();
    }

    notifyOpenCallbacks(event) {
        for (let i = 0; i < this.onOpenCallbacks.length; i++) {
            this.onOpenCallbacks[i].call(this, event);
        }
    }

    fireQueue() {
        // console.log("fireQueue()");
        while (this.sendQueue.length && this.socket.readyState === this.readyStateConstants.OPEN) {
            let data = this.sendQueue.shift();

            // console.log("fireQueue: ", data);
            if (data.binary) {
                this.socket.send(data.message);
            } else {
                this.socket.send(
                       $WebSocket.Helpers.isString(data.message) ? data.message : JSON.stringify(data.message)
                );
            }
            // data.deferred.resolve();
        }
    }

    notifyCloseCallbacks(event) {
        for (let i = 0; i < this.onCloseCallbacks.length; i++) {
            this.onCloseCallbacks[i].call(this, event);
        }
    }

    notifyErrorCallbacks(event) {
        for (let i = 0; i < this.onErrorCallbacks.length; i++) {
            this.onErrorCallbacks[i].call(this, event);
        }
    }

    onOpen(cb) {
        this.onOpenCallbacks.push(cb);
        return this;
    };

    onClose(cb) {
        this.onCloseCallbacks.push(cb);
        return this;
    }

    onError(cb) {
        this.onErrorCallbacks.push(cb);
        return this;
    };

    onMessage(callback, options?) {
        if (!$WebSocket.Helpers.isFunction(callback)) {
            throw new Error('Callback must be a function');
        }

        this.onMessageCallbacks.push({
            fn: callback,
            pattern: options ? options.filter : undefined,
            autoApply: options ? options.autoApply : true
        });
        return this;
    }

    onMessageHandler(message: MessageEvent) {
        let self = this;
        let currentCallback;
        for (let i = 0; i < self.onMessageCallbacks.length; i++) {
            currentCallback = self.onMessageCallbacks[i];
            currentCallback.fn.apply(self, [message]);
        }
    };

    onCloseHandler(event: CloseEvent) {
        this.notifyCloseCallbacks(event);
        if ((this.config.reconnectIfNotNormalClose && event.code !== this.normalCloseCode)
               || this.reconnectableStatusCodes.indexOf(event.code) > -1) {
            this.reconnect();
        } else {
            this.sendQueue = [];
            this.dataStream.complete();
        }
    };

    onErrorHandler(event) {
        this.notifyErrorCallbacks(event);
    };

    reconnect() {
        this.close(true, true);
        let backoffDelay = this.getBackoffDelay(++this.reconnectAttempts);
        // let backoffDelaySeconds = backoffDelay / 1000;
        // console.log('Reconnecting in ' + backoffDelaySeconds + ' seconds');
        setTimeout(() => {
            if (this.config.reconnectIfNotNormalClose) {
                this.connect()
            }
        }, backoffDelay);
        return this;
    }

    close(force: boolean = false, keepReconnectIfNotNormalClose?: boolean) {
        if (!keepReconnectIfNotNormalClose) {
            this.config.reconnectIfNotNormalClose = false;
        }

        if (force || !this.socket.bufferedAmount) {
            this.socket.close(this.normalCloseCode);
        }
        return this;
    };

    // Exponential Backoff Formula by Prof. Douglas Thain
    // http://dthain.blogspot.co.uk/2009/02/exponential-backoff-in-distributed.html
    getBackoffDelay(attempt) {
        let R = Math.random() + 1;
        let T = this.config.initialTimeout;
        let F = 2;
        let N = attempt;
        let M = this.config.maxTimeout;

        return Math.floor(Math.min(R * T * Math.pow(F, N), M));
    };

    setInternalState(state) {
        if (Math.floor(state) !== state || state < 0 || state > 4) {
            throw new Error('state must be an integer between 0 and 4, got: ' + state);
        }

        this.internalConnectionState = state;

    }

    getReadyState() {
        if (this.socket == null) {
            return this.readyStateConstants.UNINITIALIZED;
        }
        return this.internalConnectionState || this.socket.readyState;
    }
}

export interface WebSocketConfig {
    initialTimeout?: number;
    maxTimeout?: number;
    reconnectIfNotNormalClose?: boolean;
}

export enum WebSocketSendMode {
    Direct, Promise, Observable
}

export type BinaryType = "blob" | "arraybuffer";
