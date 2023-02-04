import crypto from "node:crypto"
import * as util from "./util.js"

/** Verifies and signs data against the key and secret.
 *
 * @constructor
 * @param {String} key app key
 * @param {String} secret app secret
 */
export default class Token {
  constructor(key, secret) {
    this.key = key
    this.secret = secret
  }

  /** Signs the string using the secret.
   *
   * @param {String} string
   * @returns {String}
   */
  sign(string) {
    return crypto
      .createHmac("sha256", this.secret)
      .update(Buffer.from(string))
      .digest("hex")
  }

  /** Checks if the string has correct signature.
   *
   * @param {String} string
   * @param {String} signature
   * @returns {Boolean}
   */
  verify(string, signature) {
    return util.secureCompare(this.sign(string), signature)
  }
}
