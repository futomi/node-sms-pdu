node-sms-pdu
===============

The node-sms-pdu is a SMS-SUBMIT PDU (Packet Data Unit) generator and SMS-SUBMIT/DELIVER PDU parser. This module supports the GSM 7-bit default alphabet encoding and the UCS-2 16-bit alphabet encoding. Besides, it supports the Concatenated (or Multipart or Long) SMS.

## Dependencies

* [Node.js](https://nodejs.org/en/) 10 +

## Installation

```
$ cd ~
$ npm install node-sms-pdu
```

---------------------------------------
## Table of Contents

* [Quick Start](#Quick-Start)
  * [Generating a SUBMIT-PDU for English text](#Quick-Start-1)
  * [Generating a SUBMIT-PDU for multi-byte characters](#Quick-Start-2)
  * [Generating a SUBMIT-PDU for long text](#Quick-Start-3)
* [`SmsPdu` object](#SmsPdu-object)
  * [Creating `SmsPdu` object](#Creating-SmsPdu-object)
  * [`generateSubmit()` method](#SmsPdu-generateSubmit-method)
  * [`parse()` method](#SmsPdu-parse-method)
* [Technical Note](#Technical-Note)
  * [Character encodings and packet size](#Character-encodings)
  * [Concatenated SMS](#Concatenated-SMS)
* [Release Note](#Release-Note)
* [References](#References)
* [License](#License)

---------------------------------------
## <a id="Quick-Start">Quick Start</a>

### <a id="Quick-Start-1">Generating a SUBMIT-PDU for English text</a>

The sample code below generates a list of PDUs.

```javascript
const smsPdu = require('node-sms-pdu');

const number = '09012345678'; // Telephone number (in this case, national number)
const text = 'How are you doing?'; // Text

const pdu_list = smsPdu.generateSubmit(number, text);
console.log(pdu_list);
```

The code above will output the result as follows:

```
[
  {
    buffer: <Buffer 00 01 00 0b ...>,
    hex: '0001000B819010325476F8000012C8F71D14969741F9771D447EA7DDE71F',
    length: 29,
    encoding: 'gsm'
  }
]
```

### <a id="Quick-Start-2">Generating a SUBMIT-PDU for multi-byte characters</a>

This module supports multi-byte characters. The code below, the text is Japanese "こんにちわ" which means "Hello":

```javascript
const pdu_list = smsPdu.generateSubmit('09012345678', 'こんにちわ');
console.log(pdu_list);
```

The code above will output the result as follows:

```
[
  {
    buffer: <Buffer 00 01 00 0b ...>,
    hex: '0001000B819010325476F800080A30533093306B3061308F',
    length: 23,
    encoding: 'ucs2'
  }
]
```

### <a id="Quick-Start-3">Generating a SUBMIT-PDU for long text</a>

Most of telecom carriers in the world supports long SMS messages. Technically, a long SMS message is divided into some short messages with an additional information in a packet.

This module supports a long SMS message.

```javascript
// Long text
// - Quoted from Wikipedia (https://en.wikipedia.org/wiki/SMS)
const text = 'SMS (short message service) is a text messaging service component of most telephone, Internet, and mobile device systems. It uses standardized communication protocols to enable mobile devices to exchange short text messages. An intermediary service can facilitate a text-to-voice conversion to be sent to landlines.'

const pdu_list = smsPdu.generateSubmit('09012345678', text);
console.log(pdu_list);
```

The code above will output the result as follows:

```
[
  {
    buffer: <Buffer 00 41 00 0b ...>,
    hex: '0041000B819010325476F80000A0050003000301A6CD29083547BFE57450BB...',
    length: 153,
    encoding: 'gsm'
  },
  {
    buffer: <Buffer 00 41 00 0b ...>,
    hex: '0041000B819010325476F80000A0050003000302D26F37082E7FD3DFE3377B...',
    length: 153,
    encoding: 'gsm'
  },
  {
    buffer: <Buffer 00 41 00 0b ...>,
    hex: '0041000B819010325476F8000010050003000303C26E323BED2ECF5D',
    length: 27,
    encoding: 'gsm'
  }
]
```

---------------------------------------
## <a id="SmsPdu-object">`SmsPdu` object</a>

### <a id="Creating-SmsPdu-object">Creating `SmsPdu` object</a>

In order to use this module , you have to get the `SmsPdu` object loading this module as follows:

```JavaScript
const smsPdu = require('node-sms-pdu');
```

In the code snippet above, the variable `smsPdu` is a `SmsPdu` object. For now, the `SmsPdu` object has only [`generateSubmit()`](#SmsPdu-generateSubmit-method) method as described in sections below.

### <a id="SmsPdu-generateSubmit-method">`generateSubmit()` method</a>

The `generateSubmit()` method generates PDUs from the specified telephone number and message text. This method takes up to 3 arguments. The first one is a telephone number, the second one is a message text, the 3rd argument is an object containing option parameters.

```javascript
const pdu_list = smsPdu.generateSubmit('09012345678', 'Howdy');
```

No.	| name             | Type   | Required | Description
:---|:-----------------|:-------|:---------|:----------------
1   | Telephone number | String | Required | This module supports not only national number but also international number. If you want to specify an international number, the number must start with `+`. For example, if the national number is `09012345678`, then the international number must be `+819012345678`. In this case, `+81` is a country dial-in codes, which means Japan, `9012345678` is the national number.
2   | Message Text     | String | Required | This module supports multi-byte characters.
3   | Options          | Object | Optional | See the description below.

You can specify the encoding in the 3rd argument as follows:

```javascript
const pdu_list = smsPdu.generateSubmit('09012345678', 'Howdy', { encoding: 'ucs2' });
```

The `encoding` must be "`gsm`" or "`ucs2`". Basically, you do not have to use this option because this module determines the proper encoding automatically.

This method returns an `Array` object containing generated PDU data as follows:

```
[
  {
    buffer: <Buffer 00 01 00 0b ...>,
    hex: '0001000B819010325476F8000012C8F71D14969741F9771D447EA7DDE71F',
    length: 29,
    encoding: 'gsm'
  }
]
```

Each element in the `Array` object consists of the properties as follows:

Property	 | Type	  | Description
:----------|:--------|:------------------------
`buffer`   | Buffer  | [`Buffer`](https://nodejs.org/api/buffer.html) object of the generated PDU
`hex`      | String  | Hexadecimal string of the generated PDU
`length`   | Integer | Byte length (see the description below in details)
`encoding` | String  | `"gsm"` or `"ucs2`" (see the description below in details)

If the specified message text cannot be encoded into one packet (i.e., it cannot be encoded to within 140 bytes), this method automatically divides the message into some PDUs.

The `length` is the byte length of the generated PDU excluding the SMSC (Short Message Service Center) field. Note that this value is *not* the byte length of the generated PDU itself. The SMSC field is always `0x00` (1 byte). Therefore, the value of the `length` is always the length of the generated PDU minus 1. The value of the `length` is used in AT commands to control LTE/3G modems.

The `encoding` indicates the character encoding. The value can be `"gsm"` or `"ucs2"`. The `"gsm"` means "GSM 7-bit default alphabet and extension". The `"ucs2"` means "16-bit alphabet (UCS-2)". Though 3GPP TS 23.041 (GSM 03.41) specification allows 8-bit alphabet, this module does not support it for now.

This method automatically determines the appropriate encoding. If you want to force your preferred encoding, you can specify the encoding to this method. If the message text cannot be encoded to the specified encoding, this method throws an exception.

### <a id="SmsPdu-parse-method">`parse()` method</a>

This method parses the specified SMS-SUBMIT/DELIVER PDU data. The PDU data must be a HEX string or a `Buffer` object.

```javascript
const data = smsPdu.parse('0001000B818080674523F1000005C8F79D9C07');
console.log(JSON.stringify(data, null, ' '));
```

The code above parses a SMS-SUBMIT PDU. It will output the result as follows:

```
{
  "smsc": null,
  "type": "SMS-SUBMIT",
  "reference": 0,
  "destination": "08087654321",
  "period": null,
  "concat": null,
  "text": "Howdy"
}
```

Let's see another example:

```javascript
const data = smsPdu.parse('0891180978563412F0040B809010325476F80008022031611463630A30533093306B3061306F');
console.log(JSON.stringify(data, null, ' '));
```

The code above parses a SMS-DELIVER PDU. It will output the result as follows. (In this case, the SMS message is Japanese text which means "Hello".)

```
{
  "smsc": "+8190876543210",
  "type": "SMS-DELIVER",
  "origination": "09012345678",
  "timestamp": "2020-02-13T16:41:36+09:00",
  "concat": null,
  "text": "こんにちは"
}
```

As you can see the above examples, the items in the results are different depending on the message type.

#### Common items

Property      | Type   | Description
:-------------|:-------|:-------------------------
`smsc`        | String | SMSC address. In the case of SMS-SUBMIT, this value is always `null`.
`type`        | String | Message type. The value is `"SMS-SUBMIT"` or `"SMS-DELIVER"`.
`concat`      | Object | Concatenated SMS (CSMS) information. If no infomation exists in the PDU, this value will be `null`.
&nbsp;&nbsp;&nbsp;&nbsp;`reference` | Integer | CSMS reference number.
&nbsp;&nbsp;&nbsp;&nbsp;`total`     | Integer | Total number of parts.
&nbsp;&nbsp;&nbsp;&nbsp;`sequence`  | Integer | This part's number in the sequence.
`text`        | String | SMS text.


#### SMS-SUBMIT specific items

Property      | Type    | Description
:-------------|:--------|:-------------------------
`reference`   | Integer | Message reference Number
`destination` | String  | Destination address (phone number).
`period`      | String  | Validity period. If the value is `"4d"`, it means 4 days. The unit could be `"m"` (minutes), `"d"` (days), `"w"` (weeks). If no validity period information exists in the PDU, this value will be `null`.

#### SMS-DELIVER specific items

Property      | Type   | Description
:-------------|:-------|:-------------------------
`origination` | String | Origination address (phone number).
`timestamp`   | String | Time stamp. 

#### Parse error

If the PDU data passed to this method is invalid or this method fails to parse the PDU data, this method returns an object containing the `error` property. The value of the `error` property is an [`Error`](https://nodejs.org/api/errors.html) object. Note that this method does not throw an exception.

```javascript
const data = smsPdu.parse('0002000B818080674523F1000005C8F79D9C07');
if(data.error) {
  console.log(error.message);
} else {
  console.log(JSON.stringify(data, null, ' '));
}
```

The code above will output an error message as follows:

```
The message type is not supported: MTI=2
```

---------------------------------------
## <a id="Technical-Note">Technical Note</a>

### <a id="Character-encodings">Character encodings and packet size</a>

This module supports "GSM 7-bit default alphabet and extension" and "16-bit alphabet (UCS-2)" as an character encoding. These encodings are specified in the [GSM 03.38](https://en.wikipedia.org/wiki/GSM_03.38).

The "GSM 7-bit default alphabet and extension" can express ASCII characters and some Greek alphabets. Each character is encoded to a 7-bit chunk which is called "septet". Therefore, a SMS message can carry up to 160 characters in theory (7 bits * 160 characters = 1,120 bits = 140 bytes). But some characters consume 2 septets each, which are defined as the extension. For example, `{`, `}`, `[`, `]`, `|`, `^` are defined as the extension. If these characters are used in the message text, a SMS message can carry less than 160 characters.

On the other hand, text messages including multi-byte characters, such as Japanese and Chinese and so on, are encoded to UCS-2. All characters are encoded to 2 bytes each. Therefore, a SMS message can carry up to 70 characters. Note that even ASCII characters are encoded to 2 bytes each.

### <a id="Concatenated-SMS">Concatenated SMS</a>

In recent years, many telecom carriers in the world supports [Concatenated SMS](https://en.wikipedia.org/wiki/Concatenated_SMS) (a.k.a. Multipart SMS, Long SMS).

The mechanism of the Concatenated SMS is simple. A long message are divided into some SMS messages so that the byte length of each message is less than 140 bytes. 3GPP specification allows up to 255 segmentations. But the limit depends on each telecom carrier and terminal device.

When a long message are divided into some segments, each segment requires 6 bytes for segmentation information in a message data payload, which is called [UDH (User Data Header)](https://en.wikipedia.org/wiki/User_Data_Header). That is, in the case of GSM 7-bit encoding, 7 septets (characters) are lost in each SMS message due to UDH. Each SMS message can carry up to 153 characters. In the case of UCS-2 16-bit encoding, 3 characters are lost in each SMS message due to UDH, each SMS message can carry up to 67 characters.

---------------------------------------
## <a id="Release-Note">Release Note</a>

* v0.3.0 (2020-10-29)
  * Added support for decoding (parsing) the alphanumeric representation of the origination address. (thanks to [@ingria](https://github.com/futomi/node-sms-pdu/issues/1))
* v0.2.0 (2020-02-23)
  * Added the `reference` property in [the SMS-SUBMIT specific items](#sms-submit-specific-items), which means the message reference number.
* v0.1.1 (2020-02-21)
  * Corrected the header comment in each script (The module name was wrong.). You don't need to update this module. Nothing was changed.
* v0.1.0 (2020-02-20)
  * Newly added the [`parse()`](#SmsPdu-parse-method) method.
* v0.0.2 - 0.0.4 (2020-01-27)
  * Revised this document and .npmignore
* v0.0.1 (2020-01-26)
  * First public release

---------------------------------------
## <a id="References">References</a>

* Wikipedia
  * [SMS](https://en.wikipedia.org/wiki/SMS)
  * [GSM 03.38](https://en.wikipedia.org/wiki/GSM_03.38)
  * [Concatenated SMS](https://en.wikipedia.org/wiki/Concatenated_SMS)
  * [User Data Header](https://en.wikipedia.org/wiki/User_Data_Header)
* The Unicode Consortium
  * [GSM 03.38 to Unicode](https://www.unicode.org/Public/MAPPINGS/ETSI/GSM0338.TXT)
* [JavaScript PDU Mode SMS Decoder](https://smspdu.benjaminerhart.com/)

---------------------------------------
## <a id="License">License</a>

The MIT License (MIT)

Copyright (c) 2020 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
