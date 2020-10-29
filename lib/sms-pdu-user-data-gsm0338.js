/* ------------------------------------------------------------------
* node-sms-pdu - sms-pdu-user-data-gsm0338.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-10-29
* ---------------------------------------------------------------- */
'use strict';

class SmsPduUserDataGsm0338 {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - None
  * ---------------------------------------------------------------- */
  constructor() {
    // SMS message size limit (bytes)
    this._MESSAGE_BYTE_LIMIT = 140;

    // ---------------------------------------------------------------
    // GSM 7-bit default alphabet and extension table
    // - The keys in the object represent GSM codes
    // - The values in the object represent Unicode scalar values,
    //   that is, code points
    // - Reference
    //   https://www.unicode.org/Public/MAPPINGS/ETSI/GSM0338.TXT
    // ---------------------------------------------------------------
    this._DECODE_TABLE = {
      0x00: 0x0040, // @ (COMMERCIAL AT)
      0x01: 0x00A3, // £ (POUND SIGN)
      0x02: 0x0024, // $ (DOLLAR SIGN)
      0x03: 0x00A5, // ¥ (YEN SIGN)
      0x04: 0x00E8, // è (LATIN SMALL LETTER E WITH GRAVE)
      0x05: 0x00E9, // é (LATIN SMALL LETTER E WITH ACUTE)
      0x06: 0x00F9, // ù (LATIN SMALL LETTER U WITH GRAVE)
      0x07: 0x00EC, // ì (LATIN SMALL LETTER I WITH GRAVE)
      0x08: 0x00F2, // ò (LATIN SMALL LETTER O WITH GRAVE)
      0x09: 0x00E7, // Ç (LATIN SMALL LETTER C WITH CEDILLA)
      0x0A: 0x000A, // (LINE FEED)
      0x0B: 0x00D8, // Ø (LATIN CAPITAL LETTER O WITH STROKE)
      0x0C: 0x00F8, // ø (LATIN SMALL LETTER O WITH STROKE)
      0x0D: 0x000D, // (CARRIAGE RETURN)
      0x0E: 0x00C5, // Å (LATIN CAPITAL LETTER A WITH RING ABOVE)
      0x0F: 0x00E5, // å (LATIN SMALL LETTER A WITH RING ABOVE)
      0x10: 0x0394, // Δ (GREEK CAPITAL LETTER DELTA)
      0x11: 0x005F, // _ (LOW LINE)
      0x12: 0x03A6, // Φ (GREEK CAPITAL LETTER PHI)
      0x13: 0x0393, // Γ (GREEK CAPITAL LETTER GAMMA)
      0x14: 0x039B, // Λ (GREEK CAPITAL LETTER LAMDA)
      0x15: 0x03A9, // Ω (GREEK CAPITAL LETTER OMEGA)
      0x16: 0x03A0, // Π (GREEK CAPITAL LETTER PI)
      0x17: 0x03A8, // Ψ (GREEK CAPITAL LETTER PSI)
      0x18: 0x03A3, // Σ (GREEK CAPITAL LETTER SIGMA)
      0x19: 0x0398, // Θ (GREEK CAPITAL LETTER THETA)
      0x1A: 0x039E, // Ξ (GREEK CAPITAL LETTER XI)
      0x1B: 0x00A0, // (ESCAPE TO EXTENSION TABLE (or displayed as NBSP, see note above))
      0x1C: 0x00C6, // Æ (LATIN CAPITAL LETTER AE)
      0x1D: 0x00E6, // æ (LATIN SMALL LETTER AE)
      0x1E: 0x00DF, // ß (LATIN SMALL LETTER SHARP S (German))
      0x1F: 0x00C9, // É (LATIN CAPITAL LETTER E WITH ACUTE)
      0x20: 0x0020, // (SPACE)
      0x21: 0x0021, // ! (EXCLAMATION MARK)
      0x22: 0x0022, // " (QUOTATION MARK)
      0x23: 0x0023, // # (NUMBER SIGN)
      0x24: 0x00A4, // ¤ (CURRENCY SIGN)
      0x25: 0x0025, // % (PERCENT SIGN)
      0x26: 0x0026, // & (AMPERSAND)
      0x27: 0x0027, // ' (APOSTROPHE)
      0x28: 0x0028, // ( (LEFT PARENTHESIS)
      0x29: 0x0029, // ) (RIGHT PARENTHESIS)
      0x2A: 0x002A, // * (ASTERISK)
      0x2B: 0x002B, // + (PLUS SIGN)
      0x2C: 0x002C, // , (COMMA)
      0x2D: 0x002D, // - (HYPHEN-MINUS)
      0x2E: 0x002E, // . (FULL STOP)
      0x2F: 0x002F, // / (SOLIDUS)
      0x30: 0x0030, // 0 (DIGIT ZERO)
      0x31: 0x0031, // 1 (DIGIT ONE)
      0x32: 0x0032, // 2 (DIGIT TWO)
      0x33: 0x0033, // 3 (DIGIT THREE)
      0x34: 0x0034, // 4 (DIGIT FOUR)
      0x35: 0x0035, // 5 (DIGIT FIVE)
      0x36: 0x0036, // 6 (DIGIT SIX)
      0x37: 0x0037, // 7 (DIGIT SEVEN)
      0x38: 0x0038, // 8 (DIGIT EIGHT)
      0x39: 0x0039, // 9 (DIGIT NINE)
      0x3A: 0x003A, // : (COLON)
      0x3B: 0x003B, // ; (SEMICOLON)
      0x3C: 0x003C, // < (LESS-THAN SIGN)
      0x3D: 0x003D, // = (EQUALS SIGN)
      0x3E: 0x003E, // > (GREATER-THAN SIGN)
      0x3F: 0x003F, // ? (QUESTION MARK)
      0x40: 0x00A1, // ¡ (INVERTED EXCLAMATION MARK)
      0x41: 0x0041, // A (LATIN CAPITAL LETTER A)
      0x42: 0x0042, // B (LATIN CAPITAL LETTER B)
      0x43: 0x0043, // C (LATIN CAPITAL LETTER C)
      0x44: 0x0044, // D (LATIN CAPITAL LETTER D)
      0x45: 0x0045, // E (LATIN CAPITAL LETTER E)
      0x46: 0x0046, // F (LATIN CAPITAL LETTER F)
      0x47: 0x0047, // G (LATIN CAPITAL LETTER G)
      0x48: 0x0048, // H (LATIN CAPITAL LETTER H)
      0x49: 0x0049, // I (LATIN CAPITAL LETTER I)
      0x4A: 0x004A, // J (LATIN CAPITAL LETTER J)
      0x4B: 0x004B, // K (LATIN CAPITAL LETTER K)
      0x4C: 0x004C, // L (LATIN CAPITAL LETTER L)
      0x4D: 0x004D, // M (LATIN CAPITAL LETTER M)
      0x4E: 0x004E, // N (LATIN CAPITAL LETTER N)
      0x4F: 0x004F, // O (LATIN CAPITAL LETTER O)
      0x50: 0x0050, // P (LATIN CAPITAL LETTER P)
      0x51: 0x0051, // Q (LATIN CAPITAL LETTER Q)
      0x52: 0x0052, // R (LATIN CAPITAL LETTER R)
      0x53: 0x0053, // S (LATIN CAPITAL LETTER S)
      0x54: 0x0054, // T (LATIN CAPITAL LETTER T)
      0x55: 0x0055, // U (LATIN CAPITAL LETTER U)
      0x56: 0x0056, // V (LATIN CAPITAL LETTER V)
      0x57: 0x0057, // W (LATIN CAPITAL LETTER W)
      0x58: 0x0058, // X (LATIN CAPITAL LETTER X)
      0x59: 0x0059, // Y (LATIN CAPITAL LETTER Y)
      0x5A: 0x005A, // Z (LATIN CAPITAL LETTER Z)
      0x5B: 0x00C4, // Ä (LATIN CAPITAL LETTER A WITH DIAERESIS)
      0x5C: 0x00D6, // Ö (LATIN CAPITAL LETTER O WITH DIAERESIS)
      0x5D: 0x00D1, // Ñ (LATIN CAPITAL LETTER N WITH TILDE)
      0x5E: 0x00DC, // Ü (LATIN CAPITAL LETTER U WITH DIAERESIS)
      0x5F: 0x00A7, // § (SECTION SIGN)
      0x60: 0x00BF, // ¿ (INVERTED QUESTION MARK)
      0x61: 0x0061, // a (LATIN SMALL LETTER A)
      0x62: 0x0062, // b (LATIN SMALL LETTER B)
      0x63: 0x0063, // c (LATIN SMALL LETTER C)
      0x64: 0x0064, // d (LATIN SMALL LETTER D)
      0x65: 0x0065, // e (LATIN SMALL LETTER E)
      0x66: 0x0066, // f (LATIN SMALL LETTER F)
      0x67: 0x0067, // g (LATIN SMALL LETTER G)
      0x68: 0x0068, // h (LATIN SMALL LETTER H)
      0x69: 0x0069, // i (LATIN SMALL LETTER I)
      0x6A: 0x006A, // j (LATIN SMALL LETTER J)
      0x6B: 0x006B, // k (LATIN SMALL LETTER K)
      0x6C: 0x006C, // l (LATIN SMALL LETTER L)
      0x6D: 0x006D, // m (LATIN SMALL LETTER M)
      0x6E: 0x006E, // n (LATIN SMALL LETTER N)
      0x6F: 0x006F, // o (LATIN SMALL LETTER O)
      0x70: 0x0070, // p (LATIN SMALL LETTER P)
      0x71: 0x0071, // q (LATIN SMALL LETTER Q)
      0x72: 0x0072, // r (LATIN SMALL LETTER R)
      0x73: 0x0073, // s (LATIN SMALL LETTER S)
      0x74: 0x0074, // t (LATIN SMALL LETTER T)
      0x75: 0x0075, // u (LATIN SMALL LETTER U)
      0x76: 0x0076, // v (LATIN SMALL LETTER V)
      0x77: 0x0077, // w (LATIN SMALL LETTER W)
      0x78: 0x0078, // x (LATIN SMALL LETTER X)
      0x79: 0x0079, // y (LATIN SMALL LETTER Y)
      0x7A: 0x007A, // z (LATIN SMALL LETTER Z)
      0x7B: 0x00E4, // ä (LATIN SMALL LETTER A WITH DIAERESIS)
      0x7C: 0x00F6, // ö (LATIN SMALL LETTER O WITH DIAERESIS)
      0x7D: 0x00F1, // ñ (LATIN SMALL LETTER N WITH TILDE)
      0x7E: 0x00FC, // ü (LATIN SMALL LETTER U WITH DIAERESIS)
      0x7F: 0x00E0, // à (LATIN SMALL LETTER A WITH GRAVE)
    };

    this._DECODE_TABLE_EXTENSION = {
      0x0A: 0x000C, // (FORM FEED)
      0x14: 0x005E, // ^ (CIRCUMFLEX ACCENT)
      0x28: 0x007B, // { (LEFT CURLY BRACKET)
      0x29: 0x007D, // } (RIGHT CURLY BRACKET)
      0x2F: 0x005C, // \ (REVERSE SOLIDUS)
      0x3C: 0x005B, // [ (LEFT SQUARE BRACKET)
      0x3D: 0x007E, // ~ (TILDE)
      0x3E: 0x005D, // ] (RIGHT SQUARE BRACKET)
      0x40: 0x007C, // | (VERTICAL LINE)
      0x65: 0x20AC, // € (EURO SIGN)
    };

    // Convert Unicode scalar values to node readable characters
    this._ENCODE_TABLE = {};
    for (let [gcode, ucode] of Object.entries(this._DECODE_TABLE)) {
      this._ENCODE_TABLE[ucode] = parseInt(gcode, 10);
    }
    this._ENCODE_TABLE_EXTENSION = {};
    for (let [gcode, ucode] of Object.entries(this._DECODE_TABLE_EXTENSION)) {
      this._ENCODE_TABLE_EXTENSION[ucode] = parseInt(gcode, 10);
    }
  }

  /* ------------------------------------------------------------------
  * parse(buf, offset)
  * - Decode the UD (User Data)
  *
  * [Arguments]
  * - buf      | Buffer  | Required | Buffer object of the UD
  * - offset   | Integer | Required | Byte offset (UDH)
  *
  * [Returen value]
  * - Decoded text
  * ---------------------------------------------------------------- */
  decode(buf, offset) {
    let char_num = Math.floor((buf.length * 8) / 7);
    let text = '';
    let escaped = false;

    for (let i = 0; i < char_num; i++) {
      let byte_offset = Math.ceil((i * 7) / 8) - 1;
      if ((i * 7) % 8 === 0) {
        byte_offset += 1;
      }

      if (byte_offset < offset) {
        continue;
      }

      let bit_offset = 8 - (((i + 1) * 7) % 8);
      bit_offset = bit_offset % 8;
      let char_code = 0;
      if (bit_offset === 0) {
        char_code = buf.readUInt8(byte_offset) >>> 1;
      } else if (bit_offset === 1) {
        char_code = buf.readUInt8(byte_offset) & 0b01111111;
      } else {
        let n0 = (buf.readUInt8(byte_offset + 1) << (bit_offset - 1)) & 0b01111111;
        let rbit_num = 7 - (8 - bit_offset);
        let n1 = buf.readUInt8(byte_offset) >>> (8 - rbit_num);
        char_code = n0 | n1;
      }

      if (char_code === 0x0D) {
        if (i === char_num - 1 && bit_offset === 0) {
          break;
        }
      }

      if (char_code === 0x1B) {
        if (escaped === true) {
          text += ' ';
        } else {
          escaped = true;
        }
        continue;
      }

      if (escaped === true) {
        escaped = false;
        if (this._DECODE_TABLE_EXTENSION[char_code]) {
          let c = this._DECODE_TABLE_EXTENSION[char_code];
          text += String.fromCharCode(c);
        } else {
          text += '?';
        }
      } else {
        if (this._DECODE_TABLE[char_code]) {
          let c = this._DECODE_TABLE[char_code];
          text += String.fromCharCode(c);
        } else {
          text += '?';
        }
      }

    }

    text = text.replace(/\@$/, '');
    return text;
  }

  /* ------------------------------------------------------------------
  * isAcceptable(text)
  * - Check if the specified text is a GSM 7 bit default alphabet text
  *   or not
  *
  * [Arguments]
  * - text   | String | Required | Text
  *
  * [Returen value]
  * - If the specified text is a GSM 7 bit default alphabet text, this
  *   method returns `true`. Otherwise, this method returns `false`.
  * ---------------------------------------------------------------- */
  isAcceptable(text) {
    if (!text || typeof (text) !== 'string') {
      throw new Error('The `text` is not a string.');
    }
    let char_list = text.split('');
    let result = true;
    for (let char of char_list) {
      let ccode = char.charCodeAt(0);
      let gcode = null;
      if (ccode in this._ENCODE_TABLE) {
        // Basic Character Set
        gcode = this._ENCODE_TABLE[ccode];
      } else if (ccode in this._ENCODE_TABLE_EXTENSION) {
        // Basic Character Set Extension
        gcode = this._ENCODE_TABLE_EXTENSION[ccode];
      }

      if (gcode === null) {
        result = false;
        break;
      }
    }
    return result;
  }

  /* ------------------------------------------------------------------
  * encode(text)
  * - Encode the specified text to a SMS message body
  *
  * [Arguments]
  * - text   | String | Required | Text
  *
  * - Array:
  *   [
  *     {
  *       length: 21, // UDL (Byte length of the UD)
  *       buffer: <Buffer 00 01...> // Buffer object of the UD
  *     },
  *     ...
  *   ]
  * ---------------------------------------------------------------- */
  encode(text) {
    if (!this.isAcceptable(text)) {
      throw new Error('The `text` includes a charcter which is not a GSM 7 bit default alphabet.');
    }

    let char_list = text.split('');

    // Create a 7bit code (septet) list
    let septet_list = [];
    for (let char of char_list) {
      let ccode = char.charCodeAt(0);
      if (ccode in this._ENCODE_TABLE) {
        // Basic Character Set
        septet_list.push(this._ENCODE_TABLE[ccode]);
      } else if (ccode in this._ENCODE_TABLE_EXTENSION) {
        // Basic Character Set Extension
        septet_list.push(0x1B);
        septet_list.push(this._ENCODE_TABLE_EXTENSION[ccode]);
      }
    }

    // Multipart
    let multipart_num = 1;
    if (septet_list.length > 160) {
      multipart_num = Math.floor(septet_list.length / 153);
      if (septet_list.length % 153) {
        multipart_num++;
      }
      if (multipart_num > 255) {
        throw new Error('The `text` is too long.');
      }
    }

    let septet_group_list = [];
    if (multipart_num === 1) {
      septet_group_list.push(septet_list);
    } else {
      let group = [];
      while (true) {
        let septet = septet_list.shift();
        if (!septet) {
          if (group.length > 0) {
            septet_group_list.push(group);
          }
          break;
        }
        group.push(septet);
        if (group.length === 153) {
          septet_group_list.push(group);
          group = [];
        }
      }
    }

    let list = [];
    for (let i = 0; i < septet_group_list.length; i++) {
      let septet_group = septet_group_list[i];

      // Determine the byte length
      let bit_len = septet_group.length * 7;
      let byte_len = Math.floor(bit_len / 8);
      let rbit_len = 8 - (bit_len % 8);
      if (rbit_len > 0) {
        byte_len++;
      }

      // Set spare bits
      if (rbit_len === 7) {
        // Set to the 7-bit code of the CR control (also used as a padding filler)
        septet_group.push(0x0D);
      }

      // Create a Buffer object
      let buf = null;
      if (multipart_num > 1) {
        buf = Buffer.alloc(6 + byte_len);
        septet_group.unshift(0, 0, 0, 0, 0, 0, 0);
      } else {
        buf = Buffer.alloc(byte_len);
      }

      // UDL (User Data Length) : Septets
      let udl = septet_group.length;

      // Pack the 7bit codes in the Buffer object
      for (let i = 0; i < septet_group.length; i++) {
        let septet = septet_group[i];

        let char_no = i + 1;
        let byte_offset = Math.floor((char_no * 7) / 8);
        let bit_offset = 8 - ((char_no * 7) % 8);
        if (char_no % 8 === 0) {
          byte_offset--;
          bit_offset = 0;
        };

        if (bit_offset === 0) {
          let n = buf.readUInt8(byte_offset) | (septet << 1);
          buf.writeUInt8(n, byte_offset);
        } else if (bit_offset === 1) {
          let n = buf.readUInt8(byte_offset) | septet;
          buf.writeUInt8(n, byte_offset);
        } else {
          let n0 = buf.readUInt8(byte_offset) | (septet >>> (bit_offset - 1));
          buf.writeUInt8(n0, byte_offset);
          let n1 = buf.readUInt8(byte_offset - 1) | ((septet << (8 - bit_offset + 1)) % 256);
          buf.writeUInt8(n1, byte_offset - 1);
        }
      }

      // UDH (User Data Header)
      if (multipart_num > 1) {
        buf.writeUInt8(0x05, 0);
        buf.writeUInt8(0x00, 1);
        buf.writeUInt8(0x03, 2);
        buf.writeUInt8(0x00, 3);
        buf.writeUInt8(multipart_num, 4);
        buf.writeUInt8(i + 1, 5);
      }

      list.push({
        length: udl,
        buffer: buf
      });
    }

    return list;
  }
}

module.exports = new SmsPduUserDataGsm0338();




