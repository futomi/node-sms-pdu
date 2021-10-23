declare namespace nodeSmsPdu {
  export type PDUEncoding = 'gsm'|'ucs2'
  /**
   * @see https://www.npmjs.com/package/node-sms-pdu#generatesubmit-method
   */
  export type PDUSubmit = {
    /**
     * Buffer object of the generated PDU
     */
    buffer: Buffer
    /**
     * Hexadecimal string of the generated PDU
     */
    hex: string
    /**
     * Byte length
     * <br>If the specified message text cannot be encoded into one packet (i.e., it cannot be encoded to within 140 bytes), this method automatically divides the message into some PDUs.
     * <br>The length is the byte length of the generated PDU excluding the SMSC (Short Message Service Center) field. Note that this value is not the byte length of the generated PDU itself.
     * <br>The SMSC field is always 0x00 (1 byte). Therefore, the value of the length is always the length of the generated PDU minus 1.
     * <br>The value of the length is used in AT commands to control LTE/3G modems.
     */
    length: number
    /**
     * `gsm` if send ascii message<br>
     * `usc2` if send unicode message
     */
    encoding: PDUEncoding
  }
  type SubmitOptions = {
    encoding: PDUEncoding
  }

  type PDUMessageConcat = {
    /**
     * CSMS reference number.
     */
    reference: number
    /**
     * Total number of parts.
     */
    total: number
    /**
     * This part's number in the sequence.
     */
    sequence: number
  }
  type PDUMessageCommon = {
    /**
     * Concatenated SMS (CSMS) information. If no information exists in the PDU, this value will be `null`.
     */
    concat: PDUMessageConcat|null
    /**
     * SMS text.
     */
    text: string
  }
  type PDUMessageSubmit = {
    /**
     * Message type
     */
    type: 'SMS-SUBMIT'
    /**
     * SMSC address
     */
    smsc: null
    /**
     * Message reference Number
     */
    reference: number
    /**
     * Destination address (phone number).
     */
    destination: string
    /**
     * Validity period.
     * <br>If the value is "4d", it means 4 days. The unit could be "m" (minutes), "d" (days), "w" (weeks).
     * <br>If no validity period information exists in the PDU, this value will be null.
     */
    period: `${number}${'m'|'d'|'w'}`|null
  }
  type PDUMessageDeliver = {
    smsc: string
    /**
     * Origination address (phone number).
     */
    origination: string
    /**
     * Time stamp.
     */
    timestamp: string
  }
  type PDUMessage = PDUMessageCommon & (PDUMessageSubmit | PDUMessageDeliver)

  /**
   * This method parses the specified SMS-SUBMIT/DELIVER PDU data. The PDU data must be a HEX string or a Buffer object.
   * @param {String|Buffer} pdu
   */
  function parse(pdu: string|Buffer): PDUMessage
  /**
   * Generates PDUs from the specified `telephone number` and `message text`.
   * @param {string} phoneNumber
   * @param {string} message
   * @param {{encoding: 'gsm'|'usc2'}} options?
   */
  function generateSubmit(phoneNumber: string, message: string, options?: SubmitOptions): PDUSubmit[]
}
export default nodeSmsPdu
