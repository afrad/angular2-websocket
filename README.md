# angular2websocket

Based on https://github.com/AngularClass/angular-websocket and migrated to Angular2
## Installation

```bash
npm install angular2-websocket
```

## Usage:
```ts
import {$WebSocket} from 'angular2-websocket/angular2-websocket'
var ws = new $WebSocket("url");
ws.send(event);

```

also
ws.getDataStream() returns Subject<any> to which you can attach an Observer (https://github.com/Reactive-Extensions/RxJS)

## Compilation
```bash
npm run typings
npm run compile

```


The default value for binary type is 'arrayBuffer'.

## example
```ts
import {$WebSocket, WebSocketSendMode} from 'angular2-websocket/angular2-websocket';
  
// connect
var ws = new $WebSocket("ws://127.0.0.1:7000");
// you can send immediately after connect, 
// data will cached until connect open and immediately send or connect fail.
  
// when connect fail, websocket will reconnect or not,
// you can set {WebSocketConfig.reconnectIfNotNormalClose = true} to enable auto reconnect
// all cached data will lost when connect close if not reconnect
  
  
// set received message callback
ws.onMessage(
    (msg: MessageEvent)=> {
        console.log("onMessage ", msg.data);
    },
    {autoApply: false}
);
  
// set received message stream
ws.getDataStream().subscribe(
    (msg)=> {
        console.log("next", msg.data);
        ws.close(false);
    },
    (msg)=> {
        console.log("error", msg);
    },
    ()=> {
        console.log("complete");
    }
);
  
// send with default send mode (now default send mode is Observer)
ws.send("some thing").subscribe(
        (msg)=> {
            console.log("next", msg.data);
        },
        (msg)=> {
            console.log("error", msg);
        },
        ()=> {
            console.log("complete");
        }
    );
  
ws.send("by default, this will never be send, because Observer is cold.");
ws.send("by default, this will be send, because Observer is hot.").publish().connect();
  
ws.setSendMode(WebSocketSendMode.Direct);
ws.send("this will be send Direct, because send mode is set to Direct.");
  
ws.send("this will be send and return Promise.", WebSocketSendMode.Promise).then(
        (T) => {
            console.log("is send");
        },
        (T) => {
            console.log("not send");
        }
    );
  
ws.send("this will be send and return Observer.").subscribe(
        (msg)=> {
            console.log("next", msg.data);
        },
        (msg)=> {
            console.log("error", msg);
        },
        ()=> {
            console.log("complete");
        }
    );

ws.close(false);    // close
ws.close(true);    // close immediately


```

## Binary type
To set the binary type for the websocket one can provide it as string in the constructor. Allowed types are:

* 'blob' (default)
* 'arraybuffer'

```ts
var ws = new $WebSocket("ws://127.0.0.1:7000", null, null, 'arraybuffer');
```