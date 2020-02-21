/* ------------------------------------------------------------------
* node-sms-pdu - sms-pdu-user-data-ucs2.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-02-21
* ---------------------------------------------------------------- */
'use strict';

class SmsPduUserDataUcs2 {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - None
  * ---------------------------------------------------------------- */
  constructor() { }

  /* ------------------------------------------------------------------
  * parse(buf, offset)
  * - Decode the UD (User Data)
  *
  * [Arguments]
  * - buf    | Buffer  | Required | Buffer object of the UD
  * - offset | Integer | Required | Byte offset (UDH)
  *
  * [Returen value]
  * - Decoded text
  * ---------------------------------------------------------------- */
  decode(buf, offset) {
    // Change the endian from BE to LE (convert UTF-16BE to UTF-16LE)
    let buf_le = Buffer.alloc(buf.length);
    for (let i = offset; i < buf.length; i += 2) {
      let byte = buf.readUInt16BE(i);
      buf_le.writeUInt16LE(byte, i);
    }

    let text = buf_le.slice(offset).toString('ucs2');
    return text;
  }

  /* ------------------------------------------------------------------
  * encode(text)
  * - Encode the specified text to a SMS message body
  *
  * [Arguments]
  * - text   | String | Required | Text
  *
  * [Returen value]
  * - Array:
  *   [
  *     {
  *       length: 21, // UDL (The number of septets in the UD)
  *       buffer: <Buffer 00 01...> // Buffer object of the UD
  *     },
  *     ...
  *   ]
  * ---------------------------------------------------------------- */
  encode(text) {
    // Check the message size
    let multipart_num = 1;
    if (text.length > 70) {
      multipart_num = Math.floor(text.length / 67);
      if (text.length % 67) {
        multipart_num++;
      }
      if (multipart_num > 255) {
        throw new Error('The `text` is too long.');
      }
    }

    let text_list = [];
    if (multipart_num === 1) {
      text_list.push(text);
    } else {
      text_list = text.match(/(.{67}|.{1,66}$)/g);
    }

    // Create a Buffer object
    let list = [];
    for (let i = 0; i < text_list.length; i++) {
      let str = text_list[i];
      // Create a Buffer object of UTF-16LE string
      let buf_le = Buffer.from(str, 'ucs2'); // 'ucs2' is as same as 'utf16le'
      // Change the endian from LE to BE (convert to UTF-16BE)
      let buf = Buffer.alloc(buf_le.length);
      for (let i = 0; i < buf.length; i += 2) {
        let byte = buf_le.readUInt16LE(i);
        buf.writeUInt16BE(byte, i);
      }
      // UDH (User Data Header)
      if (multipart_num > 1) {
        let udh_buf = Buffer.from([0x05, 0x00, 0x03, 0x00, multipart_num, i + 1]);
        buf = Buffer.concat([udh_buf, buf]);
      }

      // UDL (User Data Length): Bytes
      let udl = buf.length;

      list.push({
        length: udl,
        buffer: buf
      });
    }

    return list;
  }
}

module.exports = new SmsPduUserDataUcs2();




