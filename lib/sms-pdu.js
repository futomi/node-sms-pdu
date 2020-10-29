/* ------------------------------------------------------------------
* node-sms-pdu - sms-pdu.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-10-29
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
  * - Create a SMS PDU.
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
    if (!number || typeof (number) !== 'string' || /^\+?[0-9\-]+$/.test(number) === false) {
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
        if (typeof (encoding) !== 'string' || /^(gsm|ucs2)$/.test(encoding) === false) {
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

    for (let ud of ud_list) {
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

  /* ------------------------------------------------------------------
  * parse(data)
  * - Parse a SMS PDU data.
  *
  * [Arguments]
  * - data | String  | Required | HEX string of a SMS PDU or
  *        | Buffer  |          | Buffer object of a SMS PDU
  *
  * [Returen value]
  * ---------------------------------------------------------------- */
  parse(data) {
    // Check the `data`
    let buf = null;
    if (typeof (data) === 'string') {
      data = data.toLowerCase();
      if (/^[a-f0-9]+$/.test(data) === false || data.length === 0 || data.length % 2 !== 0) {
        return { error: new Error('The `data` must be hexadecimal representation.') };
      }
      let byte_list = [];
      for (let i = 0; i < data.length; i += 2) {
        let h = data.substring(i, i + 2);
        let n = parseInt(h, 16);
        byte_list.push(n);
      }
      buf = Buffer.from(byte_list);
    } else if (Buffer.isBuffer(data)) {
      if (data.length === 0) {
        return { error: new Error('The `data` must be a non-empty data.') };
      }
      buf = data;
    } else {
      return { error: new Error('The `data` must be a string or an Buffer object.') };
    }

    // Parse the data
    let details = null;
    try {
      details = this._parseDetails(buf);
    } catch (e) {
      return { error: e };
    }

    // Compose the response
    let res = {};

    let smsc = null;
    if (details.sca.digit > 0) {
      smsc = details.sca.address;
      if (details.sca.international) {
        smsc = '+' + smsc;
      }
    }
    res.smsc = smsc;

    if (details.pduType.mti === 0) {
      res.type = 'SMS-DELIVER';

      if (details.oa && details.oa.digit > 0) {
        let val = details.oa.address;
        if (details.oa.international) {
          val = '+' + val;
        }
        res.origination = val;
      } else {
        res.origination = null;
      }

      if (details.scts) {
        res.timestamp = details.scts;
      } else {
        res.timestamp = null;
      }

    } else if (details.pduType.mti === 1) {
      res.type = 'SMS-SUBMIT';

      res.reference = details.mr;

      if (details.da && details.da.digit > 0) {
        let val = details.da.address;
        if (details.da.international) {
          val = '+' + val;
        }
        res.destination = val;
      } else {
        res.destination = null;
      }

      if (details.vp) {
        res.period = details.vp.period + details.vp.unit;
      } else {
        res.period = null;
      }
    } else {
      return { error: new Error('Unknown PDU Type: MTI=' + details.pduType.mti) };
    }

    if (details.ud.udh) {
      res.concat = {
        reference: details.ud.udh.reference,
        total: details.ud.udh.total,
        sequence: details.ud.udh.sequence
      };
    } else {
      res.concat = null;
    }

    if (details.ud.text) {
      res.text = details.ud.text;
    } else {
      res.text = null;
    }

    res.details = details;
    return res;
  }

  _parseDetails(buf) {
    let sca = this._parseSca(buf);
    let offset = sca.length;

    if (buf.length < offset + 1) {
      throw new Error('The length of the data is insufficient.');
    }

    let pdu_type = this._parsePduType(buf.slice(offset, offset + 1));
    offset += 1;

    let res1 = {
      sca: sca,
      pduType: pdu_type
    };

    let res2 = {};

    if (pdu_type.mti === 0) {
      // SMS-DELIVER
      res2 = this._parseSmsDeliver(buf.slice(offset));
      offset += res2.length;
      delete res2.length;
    } else if (pdu_type.mti === 1) {
      // SMS-SUBMIT
      res2 = this._parseSmsSubmit(buf.slice(offset), pdu_type.vpf);
      offset += res2.length;
      delete res2.length;
    } else {
      throw new Error('The message type is not supported: MTI=' + pdu_type.mti);
    }

    let res = Object.assign(res1, res2);

    // UDL: User Data Length
    let udl = buf.readUInt8(offset);
    res.udl = udl;
    offset += 1;

    if (res.dcs.alphabet === 0) {
      if (buf.length !== offset + Math.ceil(udl * 7 / 8)) {
        throw new Error('The length of the data is insufficient.');
      }
    } else {
      if (buf.length !== offset + udl) {
        throw new Error('The length of the data is insufficient.');
      }
    }

    // UD: User Data
    res.ud = {};

    // UDH: User Data Header
    let ud_buf = buf.slice(offset);
    let udh = null;
    let udh_len = 0;
    if (res.pduType.udhi === true) {
      udh = this._parseUdh(ud_buf);
      udh_len = udh.length;
      delete udh.length;
    }
    res.ud.udh = udh;

    if (buf.length === offset + udh_len) {
      return res;
    }

    // Data
    if (res.dcs.alphabet === 0) {
      // Default alphabet (7bit)
      res.ud.text = mSmsPduUserDataGsm0338.decode(ud_buf, udh_len);
    } else if (res.dcs.alphabet === 2) {
      // UCS2 (16bit)
      res.ud.text = mSmsPduUserDataUcs2.decode(ud_buf, udh_len);
    } else {
      res.ud.hex = ud_buf.toString('hex').toUpperCase()
    }

    return res;
  }

  _parseSca(buf) {
    let len = buf.readUInt8(0) + 1;
    if (len === 1) {
      return {
        length: 1,
        digit: 0,
        international: false,
        address: ''
      };
    }

    if (buf.length < len) {
      throw new Error('The length of the data is insufficient.');
    }

    let type = buf.readUInt8(1);
    let international = (type === 0x91) ? true : false;

    let address = '';
    for (let i = 2; i < len; i++) {
      let hex = buf.slice(i, i + 1).toString('hex');
      address += hex.substring(1, 2);
      address += hex.substring(0, 1);
    }
    address = address.replace(/f$/, '');

    return {
      length: len,
      digit: address.length,
      international: international,
      address: address
    };
  }

  _parsePduType(buf) {
    let n = buf.readUInt8(0);

    // RP: Whether the reply Path parameter is set or not in this SMS-SUBMIT
    let rp = (n & 0b10000000) ? true : false;

    // UDHI: Whether the UD (User Data) contains a UDH (User Data Header) or not
    let udhi = (n & 0b01000000) ? true : false;

    // SRR: Status Report Request (A status report is requested or not) (For SMS-SUBMIT)
    // SRI: Status Report Indicator (A status report will be returned to the SME or not) (For SMS-DELIVER)
    let srr = (n & 0b00100000) ? true : false;
    let sri = srr;

    // VPF: Validity Period Format (For SMS-SUBMIT)
    // - 0 (0b00): Validity Period not present
    // - 1 (0b01): Validity Period present - enhanced format (reserved)
    // - 2 (0b10): Validity Period present- relative format
    // - 3 (0b00): Validity Period present - absolute format
    let vpf = (n & 0b00011000) >>> 3;

    // RD: Reject Duplicates (For SMS-SUBMIT)
    // MMS: More Message to Send (For SMS-DELIVER)
    let rd = (n & 0b00000100) ? true : false;
    let mms = rd;

    // MTI: Message Type Indicator
    // - 0 (0b00): SMS-DELIVER (in the direction SC to MS)
    //             SMS-DELIVER REPORT (in the direction MS to SC)
    // - 1 (0b01): SMS-SUBMIT (in the direction MS to SC)
    //             SMS-SUBMIT-REPORT (in the direction SC to MS)
    // - 2 (0b02): SMS-STATUS-REPORT (in the direction SC to MS)
    //             SMS-COMMAND (in the direction MS to SC)
    let mti = n & 0b00000011;

    let res = {
      rp: rp,
      udhi: udhi,
      vpf: vpf,
      mti: mti
    };

    if (mti === 0) {
      // SMS-SUBMIT
      res.srr = srr;
      res.rd = rd;
      return res;
    } else if (mti === 1) {
      // SMS-DELIVER
      res.sri = sri;
      res.mms = mms;
      return res;
    } else {
      throw new Error('The message type is not supported: MTI=' + mti);
    }
  }

  _parseSmsSubmit(buf, vpf) {
    if (buf.length < 8) {
      throw new Error('The length of the data is insufficient.');
    }

    // MR: Message Reference
    let mr = buf.readUInt8(0);
    let offset = 1;

    // DA: Destination Address
    let da = this._parseAddress(buf.slice(1));
    offset += da.length;

    if (buf.length < offset + 3) {
      throw new Error('The length of the data is insufficient.');
    }

    // PID: Protocol Identifier
    let pid = buf.readUInt8(offset);
    offset += 1;

    // DCS: Data Coding Scheme
    let dcs = this._parseDcs(buf.slice(offset, offset + 1));
    offset += 1;

    // VP: Validity Period
    let vp = null;
    if (vpf === 0b10) {
      if (buf.length < offset + 2) {
        throw new Error('The length of the data is insufficient.');
      }
      vp = this._parseVpRelative(buf.slice(offset, offset + 1));
      offset += 1;
    } else if (vpf === 0b11) {
      if (buf.length < offset + 8) {
        throw new Error('The length of the data is insufficient.');
      }
      vp = this._parseVpAbsolute(buf.slice(offset, offset + 7));
      offset += 7;
    }

    return {
      length: offset,
      mr: mr,
      da: da,
      pid: pid,
      dcs: dcs,
      vp: vp
    };
  }

  _parseSmsDeliver(buf) {
    if (buf.length < 11) {
      throw new Error('The length of the data is insufficient.');
    }

    let offset = 0;

    // OA: Origination Address
    let oa = this._parseAddress(buf);
    offset += oa.length;

    if (buf.length < offset + 9) {
      throw new Error('The length of the data is insufficient.');
    }

    // PID: Protocol Identifier
    let pid = buf.readUInt8(offset);
    offset += 1;

    // DCS: Data Coding Scheme
    let dcs = this._parseDcs(buf.slice(offset, offset + 1));
    offset += 1;

    // SCTS: Service Center Time Stamp
    let scts = this._parseScts(buf.slice(offset, offset + 7));
    offset += 7;

    return {
      length: offset,
      oa: oa,
      pid: pid,
      dcs: dcs,
      scts: scts
    };
  }

  _parseAddress(buf) {
    let digit = buf.readUInt8(0);

    if (digit === 0) {
      return {
        length: 1,
        digit: 0,
        international: false,
        address: ''
      };
    }

    let len = Math.ceil(digit / 2) + 2;

    if (buf.length < len) {
      throw new Error('The length of the data is insufficient.');
    }

    let address_type = buf.readUInt8(1);
    let number_type = (address_type & 0b01110000) >>> 4;
    let international = (number_type === 0b001) ? true : false;

    let address = '';
    if (number_type === 0b101) {
      // Alphanumeric, (coded according to GSM TS 03.38 7-bit default alphabet)
      address = mSmsPduUserDataGsm0338.decode(buf.slice(2, len), 0);
    } else {
      for (let i = 2; i < len; i++) {
        let hex = buf.slice(i, i + 1).toString('hex');
        address += hex.substring(1, 2);
        address += hex.substring(0, 1);
      }
      address = address.replace(/f$/, '');
    }

    return {
      length: len,
      digit: digit,
      international: international,
      type: number_type,
      address: address
    };
  }

  _parseDcs(buf) {
    let n = buf.readUInt8(0);
    let res = {};

    // Compessed
    if ((n >>> 6) === 0b00) {
      res.compressed = (n & 0b00100000) ? true : false;
    } else {
      res.compressed = false;
    }

    // Message Class
    if (n & 0b00010000) {
      // - 0 (0b00): Class 0 (immediate display) 
      // - 1 (0b01): Class 1 (ME specific) 
      // - 2 (0b10): Class 2 (SIM specific) 
      // - 3 (0b11): Class 3 (TE specific) 
      res.mclass = (n & 0b00000011);
    } else {
      res.mclass = -1;
    }

    // Alphabet
    // - 0 (0b00): Default alphabet (7bit)
    // - 1 (0b01): 8 bit data
    // - 2 (0b10): UCS2 (16bit)
    res.alphabet = (n & 0b00001100) >>> 2;
    return res;
  }

  _parseVpRelative(buf) {
    let vpn = buf.readUInt8(0);
    let vp = {};
    if (vpn <= 143) {
      vp = {
        period: (vpn + 1) * 5,
        unit: 'm' // Minutes
      };
    } else if (vpn <= 167) {
      vp = {
        period: (12 * 60) + ((vpn - 143) * 30),
        unit: 'm' // Minites
      };
    } else if (vpn <= 196) {
      vp = {
        period: vpn - 166,
        unit: 'd' // Days
      };
    } else {
      vp = {
        period: vpn - 192,
        unit: 'w' // Weeks
      };
    }
    return vp;
  }

  _parseVpAbsolute(buf) {
    let ts = this._parseScts(buf);
    return {
      datetime: ts
    };
  }

  _parseScts(buf) {
    let digits = buf.toString('hex').split('');

    let Y = parseInt(digits[1] + digits[0], 10);
    if (Y > (new Date).getFullYear() % 100) {
      Y += 1900;
    } else {
      Y += 2000;
    }
    Y = Y.toString();

    let M = digits[3] + digits[2];
    let D = digits[5] + digits[4];
    let h = digits[7] + digits[6];
    let m = digits[9] + digits[8];
    let s = digits[11] + digits[10];
    let tz_mins = parseInt(digits[13] + digits[12], 10) * 15;
    let tz_h = ('0' + Math.floor(tz_mins / 60)).slice(-2);
    let tz_m = ('0' + (tz_mins % 60)).slice(-2);

    let date = [Y, M, D].join('-');
    let time = [h, m, s].join(':');
    let ts = date + 'T' + time + '+' + tz_h + ':' + tz_m;
    return ts;
  }

  _parseUdh(buf) {
    // Length of User Data Header
    let len = buf.readUInt8(0);
    let byte_len = len + 1;
    if (buf.length < byte_len) {
      throw new Error('The length of the data is insufficient.');
    }

    // Information Element Identifier
    let iei = buf.readUInt8(1);
    if (iei !== 0x00) {
      throw new Error('The Information Element Identifier in the UDH is not supported: IEI=' + iei);
    }

    // Length of the header, excluding the first two fields
    let hlen = buf.readUInt8(2);
    if (buf.length < hlen + 2) {
      throw new Error('The length of the data is insufficient.');
    }

    // CSMS reference number
    let reference = buf.readUInt8(3);

    // Total number of parts
    let total = buf.readUInt8(4);

    // This part's number in the sequence
    let seq = buf.readUInt8(5);

    return {
      length: byte_len,
      iei: iei,
      reference: reference,
      total: total,
      sequence: seq
    };
  }

}

module.exports = new SmsPdu();




