// 'use strict';

// import Connection = require('../mysql/lib/Connection');
// const portfinder = require('portfinder');
// import { createServer, createConnection, createPool } from '../../index';

// const assert = require('assert');

// const server = createServer((conn: Connection) => {
//   conn.serverHandshake({
//     protocolVersion: 10,
//     serverVersion: '5.6.10',
//     connectionId: 1234,
//     statusFlags: 2,
//     characterSet: 8,
//     capabilityFlags: 0xffffff,
//     authCallback: function(params: any, cb: any) {
//       cb(null, { message: 'too many connections', code: 1040 });
//     }
//   });
// });

// let err1: any, err2: any;

// portfinder.getPort((err: any, port: number) => {
//   server.listen(port);
//   const conn = createConnection({
//     user: 'test_user',
//     password: 'test',
//     database: 'test_database',
//     port: port
//   });
//   conn.on('error', (err: any) => {
//     err1 = err;
//   });

//   const pool = createPool({
//     user: 'test_user',
//     password: 'test',
//     database: 'test_database',
//     port: port
//   });

//   pool.query('test sql', (err: any) => {
//     err2 = err;
//     pool.end();
//     server.close(() => {});
//   });
// });

// process.on('exit', () => {
//   assert.equal(err1.errno, 1040);
//   assert.equal(err2.errno, 1040);
// });
