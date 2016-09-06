import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';


@Injectable()
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
    private internalConnectionState: number;
    constructor(private url: string, private protocols?: Array<string>, private config?: WebSocketConfig) {
        let match = new RegExp('wss?:\/\/').test(url);
        if (!match) {
            throw new Error('Invalid url provided');
        }
        this.config = config || { initialTimeout: 500, maxTimeout: 300000, reconnectIfNotNormalClose: false };
        this.dataStream = new Subject();
    }

    connect(force = false) {
        let self = this;
        if (force || !this.socket || this.socket.readyState !== this.readyStateConstants.OPEN) {
            self.socket = this.protocols ? new WebSocket(this.url, this.protocols) : new WebSocket(this.url);

            self.socket.onopen = (ev: Event) => {
                //    console.log('onOpen: %s', ev);
                this.onOpenHandler(ev);
            };
            self.socket.onmessage = (ev: MessageEvent) => {
                //   console.log('onNext: %s', ev.data);
                self.onMessageHandler(ev);
                this.dataStream.next(ev);
            };
            this.socket.onclose = (ev: CloseEvent) => {
                //     console.log('onClose, completed');
                self.onCloseHandler(ev);
            };

            this.socket.onerror = (ev: ErrorEvent) => {
                //    console.log('onError', ev);
                self.onErrorHandler(ev);
                this.dataStream.error(ev);
            };

        }
    }
    send(data): Observable<any> {
        let self = this;
        if (this.getReadyState() !== this.readyStateConstants.OPEN
                && this.getReadyState() !== this.readyStateConstants.CONNECTING) {
            this.connect();
        }
        return Observable.create((observer) => {
            if (self.socket.readyState === self.readyStateConstants.RECONNECT_ABORTED) {
                observer.next('Socket connection has been closed');
            } else {
                self.sendQueue.push({ message: data });
                self.fireQueue();
            }
        });
    };

    getDataStream(): Subject<any> {
        return this.dataStream;
    }

    onOpenHandler(event: Event) {
        this.reconnectAttempts = 0;
        this.notifyOpenCallbacks(event);
        this.fireQueue();
    };
    notifyOpenCallbacks(event) {
        for (let i = 0; i < this.onOpenCallbacks.length; i++) {
            this.onOpenCallbacks[i].call(this, event);
        }
    }
    fireQueue() {
        while (this.sendQueue.length && this.socket.readyState === this.readyStateConstants.OPEN) {
            let data = this.sendQueue.shift();

            this.socket.send(
                $WebSocket.Helpers.isString(data.message) ? data.message : JSON.stringify(data.message)
            );
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


    onMessage(callback, options) {
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
            this.dataStream.complete();
        }
    };

    onErrorHandler(event) {
        this.notifyErrorCallbacks(event);
    };





    reconnect() {
        this.close(true);
        let backoffDelay = this.getBackoffDelay(++this.reconnectAttempts);
        // let backoffDelaySeconds = backoffDelay / 1000;
        // console.log('Reconnecting in ' + backoffDelaySeconds + ' seconds');
        setTimeout(this.connect(), backoffDelay);
        return this;
    }

    close(force: boolean) {
        if (force || !this.socket.bufferedAmount) {
            this.socket.close();
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

    /**
     * Could be -1 if not initzialized yet
     * @returns {number}
     */
    getReadyState() {
        if (this.socket == null) {
            return -1;
        }
        return this.internalConnectionState || this.socket.readyState;
    }
}

export interface WebSocketConfig {
    initialTimeout: number;
    maxTimeout: number;
    reconnectIfNotNormalClose: boolean;
}

