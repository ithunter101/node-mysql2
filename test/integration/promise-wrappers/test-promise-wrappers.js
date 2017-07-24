var config = require('../../common.js').config;
var Buffer = require('safe-buffer').Buffer;

var skipTest = false;
if (typeof Promise == 'undefined') {
  console.log('no Promise support, skipping test');
  skipTest = true;
  process.exit(0);
}

var assert = require('assert');

var createConnection = require('../../../promise.js').createConnection;
var createPool = require('../../../promise.js').createPool;

// it's lazy exported from main index.js as well. Test that it's same function
var mainExport = require('../../../index.js').createConnectionPromise;
assert.equal(mainExport, createConnection);

var doneCalled = false;
var exceptionCaught = false;
var doneEventsConnect = false;

var doneCalledPool = false;
var exceptionCaughtPool = false;
var doneEventsPool = false;
var doneChangeUser = false;

function testBasic() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.query('select 1+2 as ttt');
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('select 2+2 as qqq');
    })
    .then(function(result2) {
      assert.equal(result2[0][0].qqq, 4);
      return connResolved.end();
    })
    .then(function() {
      doneCalled = true;
    })
    .catch(function(err) {
      throw err;
    });
}

function testErrors() {
  var connResolved;
  var connPromise = createConnection(config);

  connPromise
    .then(function(conn) {
      connResolved = conn;
      return conn.query('select 1+2 as ttt');
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('bad sql');
    })
    .then(function(result2) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.query('select 2+2 as qqq');
    })
    .catch(function(err) {
      exceptionCaught = true;
      if (connResolved) {
        connResolved.end();
      } else {
        console.log('Warning: promise rejected before first query');
      }
    });
}

function testObjParams() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.query({
        sql: 'select ?-? as ttt',
        values: [5, 2]
      });
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return connResolved.execute({
        sql: 'select ?-? as ttt',
        values: [8, 5]
      });
    })
    .then(function(result2) {
      assert.equal(result2[0][0].ttt, 3);
      return connResolved.end();
    })
    .catch(function(err) {
      console.log(err);
    });
}

function testPrepared() {
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return conn.prepare('select ?-? as ttt, ? as uuu');
    })
    .then(function(statement) {
      return statement.execute([11, 3, 'test']);
    })
    .then(function(result) {
      assert.equal(result[0][0].ttt, 8);
      assert.equal(result[0][0].uuu, 'test');
      return connResolved.end();
    })
    .catch(function(err) {
      console.log(err);
      if (connResolved) {
        connResolved.end();
      } else {
        console.log(
          'Warning: promise rejected before executing prepared statement'
        );
      }
    });
}

function testEventsConnect() {
  var connPromise = createConnection(config).then(function(conn) {
    var events = 0;

    conn
      .once('error', function(connection) {
        ++events;
      })
      .once('drain', function(connection) {
        ++events;
      })
      .once('connect', function() {
        ++events;
      })
      .once('enqueue', function() {
        ++events;
      })
      .once('end', function() {
        ++events;

        doneEventsConnect = events === 5;
      });

    conn.connection.emit('error', new Error());
    conn.connection.emit('drain');
    conn.connection.emit('connect');
    conn.connection.emit('enqueue');
    conn.connection.emit('end');
    conn.end();
  });
}

function testBasicPool() {
  var pool = createPool(config);
  pool
    .query('select 1+2 as ttt')
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('select 2+2 as qqq');
    })
    .then(function(result2) {
      assert.equal(result2[0][0].qqq, 4);
      return pool.end();
    })
    .then(function() {
      doneCalledPool = true;
    })
    .catch(function(err) {
      throw err;
    });
}

function testErrorsPool() {
  var pool = createPool(config);
  pool
    .query('select 1+2 as ttt')
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('bad sql');
    })
    .then(function(result2) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.query('select 2+2 as qqq');
    })
    .catch(function(err) {
      exceptionCaughtPool = true;
      return pool.end();
    });
}

function testObjParamsPool() {
  var pool = createPool(config);
  pool
    .query({
      sql: 'select ?-? as ttt',
      values: [5, 2]
    })
    .then(function(result1) {
      assert.equal(result1[0][0].ttt, 3);
      return pool.execute({
        sql: 'select ?-? as ttt',
        values: [8, 5]
      });
    })
    .then(function(result2) {
      assert.equal(result2[0][0].ttt, 3);
      return pool.end();
    })
    .catch(function(err) {
      console.log(err);
    });
}

function testEventsPool() {
  var pool = createPool(config);
  var events = 0;

  pool
    .once('acquire', function(connection) {
      ++events;
    })
    .once('connection', function(connection) {
      ++events;
    })
    .once('enqueue', function() {
      ++events;
    })
    .once('release', function() {
      ++events;

      doneEventsPool = events === 4;
    });

  pool.pool.emit('acquire');
  pool.pool.emit('connection');
  pool.pool.emit('enqueue');
  pool.pool.emit('release');
}

function testChangeUser() {
  var onlyUsername = function(name) {
    return name.substring(0, name.indexOf('@'));
  };
  var connResolved;
  var connPromise = createConnection(config)
    .then(function(conn) {
      connResolved = conn;
      return connResolved.query(
        "GRANT ALL ON *.* TO 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
      );
    })
    .then(function() {
      return connResolved.query(
        "GRANT ALL ON *.* TO 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
      );
    })
    .then(function() {
      return connResolved.query('FLUSH PRIVILEGES');
    })
    .then(function() {
      return connResolved.changeUser({
        user: 'changeuser1',
        password: 'changeuser1pass'
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const [rows, fields] = result;
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');
      return connResolved.changeUser({
        user: 'changeuser2',
        password: 'changeuser2pass'
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const [rows, fields] = result;
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser2');
      return connResolved.changeUser({
        user: 'changeuser1',
        passwordSha1: Buffer.from(
          'f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd',
          'hex'
        ) // sha1(changeuser1pass)
      });
    })
    .then(function() {
      return connResolved.query('select current_user()');
    })
    .then(function(result) {
      const [rows, fields] = result;
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');
      doneChangeUser = true;
      return connResolved.end();
    })
    .catch(function(err) {
      if (connResolved) {
        connResolved.end();
      }
      throw err;
    });
}

testBasic();
testErrors();
testObjParams();
testPrepared();
testEventsConnect();
testBasicPool();
testErrorsPool();
testObjParamsPool();
testEventsPool();
testChangeUser();

process.on('exit', function() {
  if (skipTest) {
    return;
  }
  assert.equal(doneCalled, true);
  assert.equal(exceptionCaught, true);
  assert.equal(doneEventsConnect, true);
  assert.equal(doneCalledPool, true);
  assert.equal(exceptionCaughtPool, true);
  assert.equal(doneEventsPool, true);
  assert.equal(doneChangeUser, true);
});

process.on('unhandledRejection', function(err) {
  console.log('AAA', err.stack);
});
