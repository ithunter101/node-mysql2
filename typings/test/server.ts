import { expect } from 'chai'
const Server = require('../../lib/server');
import ServerType = require('../mysql/lib/Server');

describe('Server', function () {
    it('createServer', function (done) {
        const server: ServerType = new Server()

        server.on('connection', function (arg: any) {
            expect(arg).to.equal(1)
            done()
        })

        server.emit('connection', 1)
    })
})