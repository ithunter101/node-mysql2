import {EventEmitter} from 'events';
const { Connection } = require('./connection');

declare namespace Server {}

declare class Server extends EventEmitter {
  connections: Array<Connection>;

  listen(port: number): Server
  close(callback): void
}

export = Server;
