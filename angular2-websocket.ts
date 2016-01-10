import {Injectable} from 'angular2/core';
import {Observable} from "rxjs/Observable";
import {isPresent, isString, isArray,isFunction} from 'angular2/src/facade/lang';
import {Scheduler} from "rxjs/Rx";


@Injectable()
export class $WebSocket  {

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
    private  normalCloseCode = 1000;
    private  reconnectableStatusCodes = [4000];
    private socket: WebSocket;
    private  internalConnectionState: number;
    constructor(private url:string, private protocols?:Array<string>, private config?: WebSocketConfig  ) {
        this.config = config ||{ initialTimeout: 500, maxTimeout : 300000, reconnectIfNotNormalClose :false};
        if (url) {
            this.connect();
        } else {
            this.setInternalState(0);
        }
    }

    connect(force:boolean = false) {
        var self = this;
        if (force || !this.socket || this.socket.readyState !== this.readyStateConstants.OPEN) {
            self.socket = $WebSocket.create(this.url, this.protocols);
            self.socket.onopen =(ev: Event) => {
                console.log('onOpen: %s', ev);
                this.onOpenHandler(ev);
            };
         return new Observable(wsObserver => {
                // load event handler
             self.socket.onmessage = (ev: MessageEvent) => {
                    console.log('onNext: %s', ev.data);
                    self.onMessageHandler(ev);
                    wsObserver.next(ev);
                };
                // error event handler
                this.socket.onclose = (ev: CloseEvent) => {
                    console.log('onClose, completed');
                    self.onCloseHandler(ev);
                    wsObserver.complete()
                };
                this.socket.onerror = (ev: Event) => {
                    console.log('onError');
                    self.onErrorHandler(ev);
                    wsObserver.error(ev);
                };
            });

        }
    }

    static create(url:string, protocols:Array<string>):WebSocket {
        var match = new RegExp('wss?:\/\/').test(url);
        if (!match) {
            throw new Error('Invalid url provided');
        }

        return protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    };
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
            var data = this.sendQueue.shift();

            this.socket.send(
                isString(data.message) ? data.message : JSON.stringify(data.message)
            );
            data.deferred.resolve();
        }
    }

    notifyCloseCallbacks(event) {
        for (let i = 0; i < this.onCloseCallbacks.length; i++) {
            this.onCloseCallbacks[i].call(this, event);
        }
    }

    notifyErrorCallbacks(event) {
        for (var i = 0; i < this.onErrorCallbacks.length; i++) {
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
        if (!isFunction(callback)) {
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
        var pattern;
        var self = this;
        var currentCallback;
        for (var i = 0; i < self.onMessageCallbacks.length; i++) {
            currentCallback = self.onMessageCallbacks[i];
            currentCallback.fn.apply(self, message);
        }

    };
    onCloseHandler(event: CloseEvent) {
        this.notifyCloseCallbacks(event);
        if ((this.config.reconnectIfNotNormalClose && event.code !== this.normalCloseCode) || this.reconnectableStatusCodes.indexOf(event.code) > -1) {
            this.reconnect();
        }
    };

    onErrorHandler(event) {
        this.notifyErrorCallbacks(event);
    };


    send(data) {
        var self = this;
        var promise =  new Promise((resolve, reject) => {
            if (self.socket.readyState === self.readyStateConstants.RECONNECT_ABORTED) {
                reject('Socket connection has been closed');
            }
            else {
                self.sendQueue.push({
                    message: data,
                    deferred: promise
                });
                self.fireQueue();
            }

        });
    };


    reconnect() {
        this.close(true);
        var backoffDelay = this.getBackoffDelay(++this.reconnectAttempts);
        var backoffDelaySeconds = backoffDelay / 1000;
        console.log('Reconnecting in ' + backoffDelaySeconds + ' seconds');
        setTimeout( this.connect(), backoffDelay);
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
        var R = Math.random() + 1;
        var T = this.config.initialTimeout;
        var F = 2;
        var N = attempt;
        var M = this.config.maxTimeout;

        return Math.floor(Math.min(R * T * Math.pow(F, N), M));
    };

    setInternalState(state) {
        if (Math.floor(state) !== state || state < 0 || state > 4) {
            throw new Error('state must be an integer between 0 and 4, got: ' + state);
        }


        this.internalConnectionState = state;


        this.sendQueue.forEach((pending)=>{
            pending.deferred.reject('Message cancelled due to closed socket connection');
        });
    }

    getReadyState() {
        return this.internalConnectionState || this.socket.readyState;
    }

    setReadyState() {
        throw new Error('The readyState property is read-only');
    }


}

export interface WebSocketConfig {
    initialTimeout:number;
    maxTimeout:number ;
    reconnectIfNotNormalClose: boolean
}

