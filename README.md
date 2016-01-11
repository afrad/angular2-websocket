#angular2websocket
=====================
Based on https://github.com/AngularClass/angular-websocket and migrated to Angular2
Usage:
```ts
import {$WebSocket} from 'angular2-websocket/angular2-websocket'
var ws = new $WebSocket("url");
ws.send(event);

```
also 
ws.getDataStream() returns Subject<any> to which you can attach and Observer (Rxjs)
