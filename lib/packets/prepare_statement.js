'use strict';

const Packet = require('../packets/packet');
const CommandCodes = require('../constants/commands');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

class PrepareStatement {
  constructor(sql, charsetNumber, values, isProxy) {
    this.query = sql;
    this.charsetNumber = charsetNumber;
    this.encoding = CharsetToEncoding[charsetNumber];
    const val = values && isProxy? JSON.stringify(values): '';
    this.values = val.length > 0 ? ";;" + val : '';
  }

  toPacket() {
    const buf = StringParser.encode(this.query + this.values, this.encoding);
    const length = 5 + buf.length;
    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCodes.STMT_PREPARE);
    packet.writeBuffer(buf);
    return packet;
  }
}

module.exports = PrepareStatement;
