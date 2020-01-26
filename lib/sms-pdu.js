/* ------------------------------------------------------------------
* node-openblocks-sms - sms-pdu.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-01-23
* ---------------------------------------------------------------- */
'use strict';
const mSmsPduUserDataGsm0338 = require('./sms-pdu-user-data-gsm0338.js');
const mSmsPduUserDataUcs2 = require('./sms-pdu-user-data-ucs2.js');

class SmsPdu {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - None
  * ---------------------------------------------------------------- */
  constructor() { }

  /* ------------------------------------------------------------------
  * generateSubmit(number, text, options)
  * - Create a SMS PDU and push the message to the SMS queue.
  *
  * [Arguments]
  * - number     | String  | Required | Mobile phone number
  *              |         |          | - Example:
  *              |         |          |   - national: "09012345678"
  *              |         |          |   - international: "+819012345678"
  *              |         |          | - "-" in the number is acceptable but it is ignored.
  * - text       | String  | Required | Message text
  * - options    | Object  | Optional |
  *   - encoding | Integer | Optional | Encoding type:
  *              |         |          | - "gsm" : GSM 7 bit default alphabet
  *              |         |          | - "ucs2": 16 bit alphabet (UCS-2)
  *
  * [Returen value]
  *   [
  *     {
  *       "buffer"  : <Buffer 00...>,  // Buffer object of the PDU
  *       "hex"     : "0001000B81.."", // HEX string of the PDU
  *       "length"  : 21,              // Byte length without the SCA (Service Center Address)
  *       "encoding": "gsm"            // Encoding type ("gsm" or "ucs2")
  *     },
  *     ...
  *   ]
  * ---------------------------------------------------------------- */
  generateSubmit(number, text, options) {
    // Check the parameter `number`
    if (!number || typeof (number) !== 'string' || !/^\+?[0-9\-]+$/.test(number)) {
      throw new Error('The `number` is invalid.');
    }
    number = number.replace(/\-/g, '');
    let international = false;
    if (/^\+/.test(number)) {
      international = true;
      number = number.replace(/^\+/, '');
    }

    // Check the parameter `text`
    if (!text || typeof (text) !== 'string' || text.length === 0) {
      throw new Error('The `text` must be a non-empty string.');
    }

    let byte_list = [];

    // Check the parameter `options`
    if (options) {
      if (typeof (options) !== 'object') {
        throw new Error('The `options` must be an object.');
      }
    } else {
      options = {};
    }

    // Check the parameter `encoding`
    let encoding = '';
    if ('encoding' in options) {
      if (options.encoding) {
        encoding = options.encoding;
        if (typeof (encoding) !== 'string' || !/^(gsm|ucs2)$/.test(encoding)) {
          throw new Error('The `encoding` must be "gsm" or "ucs2".');
        }
      }
    }
    if (!encoding) {
      if (mSmsPduUserDataGsm0338.isAcceptable(text)) {
        encoding = 'gsm';
      } else {
        encoding = 'ucs2';
      }
    }

    // Create UD (User Data) list
    let ud_list = [];
    if (encoding === 'gsm') {
      // GSM 7-bit default alphabet
      ud_list = mSmsPduUserDataGsm0338.encode(text);
    } else if (encoding === 'ucs2') {
      // 16 bit alphabet (UCS-2)
      ud_list = mSmsPduUserDataUcs2.encode(text);
    }

    // SCA ( Service Center address)
    byte_list.push(0x00);
    let sca_byte_len = 1;

    // Protocol Data Unit Type (PDU Type)
    // - UDHI (bit 6):
    //   - 0: User Data field contains only the short message
    //   - 1: The beginning of the UD field contains a Header in addition to the short message 
    // - MTI (bit 1, 0):
    //   - 01: SMS-SUBMIT to SMSC, VP field is not present 
    let udhi = (ud_list.length > 1) ? 1 : 0;
    let mti = 0b01;
    let pdu_type = (udhi << 6) | mti;
    byte_list.push(pdu_type);

    // MR (Message Reference)
    byte_list.push(0x00);

    // DA (Destination Address) length
    let da_len = number.length;
    byte_list.push(da_len);

    // DA type of number (0x81: national, 0x91: international)
    if (international) {
      byte_list.push(0x91); // international
    } else {
      byte_list.push(0x81); // national
    }

    // DA BCD-digits
    let da_nlist = number.split('');
    if (da_nlist.length % 2 === 1) {
      da_nlist.push('f');
    }
    for (let i = 0; i < da_nlist.length; i += 2) {
      let n0 = parseInt(da_nlist[i], 16);
      let n1 = parseInt(da_nlist[i + 1], 16);
      let n = (n1 << 4) + n0;
      byte_list.push(n);
    }
    // PID (Protocol Identifier)
    let pid = 0x00; // The PDU has to be treat as a short message
    byte_list.push(pid);

    // DCS (Data Coding Scheme)
    if (encoding === 'gsm') {
      // GSM 7-bit default alphabet
      byte_list.push(0x00);
    } else if (encoding === 'ucs2') {
      // 16 bit alphabet (UCS-2)
      byte_list.push(0x08);
    } else {
      throw new Error('The `text` can not be encoded.');
    }

    // VP (Validity Period)
    // - not supported

    // Create a PDU buffer object
    let buf = Buffer.from(byte_list);
    let pdu_list = [];

    for(let ud of ud_list) {
      // UDL (User Data Length)
      let udl_buf = Buffer.from([ud.length]);
      let ud_buf = ud.buffer;
      let pdu_buf = Buffer.concat([buf, udl_buf, ud_buf]);
      pdu_list.push({
        buffer: pdu_buf,
        hex: pdu_buf.toString('hex').toUpperCase(),
        length: pdu_buf.length - sca_byte_len,
        encoding: encoding
      });
    }

    return pdu_list;
  }

  /* ------------------------------------------------------------------
  * getEncoding(number, text)
  * - Get the encoding type
  *
  * [Arguments]
  *   - text   | String  | Required | Message text
  *
  * [Returen value]
  * - "gsm" : GSM 7 bit default alphabet
  * - "ucs2": 16 bit alphabet (UCS-2)
  * ---------------------------------------------------------------- */
  getEncoding(text) {
    if (mSmsPduUserDataGsm0338.isAcceptable(text)) {
      return 'gsm';
    } else {
      return 'ucs2';
    }
  }
}

module.exports = new SmsPdu();




