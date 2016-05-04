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