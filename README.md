# angular2websocket

Based on https://github.com/AngularClass/angular-websocket and migrated to Angular2
## Installation

```bash
npm install angular2-websocket
```

## Usage:
```typescript
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

## example
```typescript
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
  
ws.send("this will be send and return Observer. Complete when send ok.", WebSocketSendMode.Observable).subscribe(
        (msg)=> {
        },
        (msg)=> {
            console.log("error", msg);
        },
        ()=> {
            console.log("complete");
        }
    );
  
ws.send("this will be send and return Observer. Next when send ok.", WebSocketSendMode.OldObservable).subscribe(
        (msg)=> {
            console.log("next", msg.data);
        },
        (msg)=> {
            console.log("error", msg);
        }
    );
  
ws.close(false);    // close
ws.close(true);    // close immediately
```

we have 4 mode to send and return.  
you can see those different in function comment.
  
  
##User Define Auto Reconnect Close Code
now you can use <code>mustReconnectCloseStatusCodeList</code> and <code>notReconnectCloseStatusCodeList</code> to set how to reconnect.  
you can see the implement code as follow :
```javascript
/**
 * when close code in <code>mustReconnectCloseStatusCodeList</code>, reconnect
 *  else,
 *      when <code>true==autoReconnect</code>
 *              AND code not in <code>notReconnectCloseStatusCodeList</code>, reconnect
 *      else not reconnect
 *
 * so, if code in <code>mustReconnectCloseStatusCodeList</code>, it always reconnect
 *     else if code in <code>notReconnectCloseStatusCodeList</code>, it always not reconnect
 *     other case see <code>autoReconnect</code>
 *
 * Be careful!!! if you set <code>true==autoReconnect</code>
 *     but <code>notReconnectCloseStatusCodeList</code> is empty,
 *     it will always auto connect.
 *   So, by default, always keep <code>notReconnectCloseStatusCodeList</code> have item <code>1000</code>
 */
if (
    (
        autoReconnect &&
        notReconnectCloseStatusCodeList.indexOf(code) == -1
    )
    || mustReconnectCloseStatusCodeList.indexOf(code) > -1
) {
    // reconnect
} else {
    // complete
}
```
