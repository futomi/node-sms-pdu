/* ------------------------------------------------------------------
* node-openblocks-sms - sms-pdu.js
*
* Copyright (c) 2020, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2020-01-23
* ---------------------------------------------------------------- */
'use strict';
const mFs = require('fs');
const mSmsPduSubmit = require('./sms-pdu-submit.js');

class SmsPdu {
  /* ------------------------------------------------------------------
  * Constructor
  *	
  * [Arguments]
  * - None
  * ---------------------------------------------------------------- */
  constructor() {
    this._QUEUE_DIR_PATH = '/tmp/.send_sms';
    this._SENT_CHECK_INTERVAL_MSEC = 200;
    this._SENT_CHECK_RETRY_LIMIT = 150; // 30 seconds
  }

  /* ------------------------------------------------------------------
  * submit(number, text)
  * - Create a SMS PDU and push the message to the SMS queue.
  *
  * [Arguments]
  *   - number   | String  | Required | Mobile phone number used in Japan.
  *              |         |          | e.g., "09012345678"
  *              |         |          | "-" is acceptable but it is ignored.
  *   - text     | String  | Required | Message text
  *
  * [Returen value]
  * - Promise object
  * - Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  submit(number, text) {
    return new Promise((resolve, reject) => {
      let pdu = mSmsPduSubmit.create(number, text);
      let pdu_hex = pdu.pdu.toString('hex');
      let data = pdu.length.toString() + ',' + pdu_hex;

      let fpath = this._QUEUE_DIR_PATH + '/' + Math.floor(Date.now() / 1000) + '.pdu';

      mFs.writeFile(fpath, data, (error) => {
        if (error) {
          reject(error);
          return;
        }

        let cnt = 0;
        let timer = setInterval(() => {
          if (!mFs.existsSync(fpath)) {
            clearInterval(timer);
            timer = null;
            resolve(data);
          }
          cnt++;
          if (cnt >= this._SENT_CHECK_RETRY_LIMIT) {
            clearInterval(timer);
            timer = null;
            reject(new Error('Failed to send the message: TIMEOUT'));
          }
        }, this._SENT_CHECK_INTERVAL_MSEC);
      });
    });
  }

}

module.exports = new SmsPdu();




