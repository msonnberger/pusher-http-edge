import * as util from "./util"

/** Verifies and signs data against the key and secret.
 *
 * @constructor
 * @param {String} key app key
 * @param {String} secret app secret
 */
export default class Token {
  key: string
  secret: string

  constructor(key: string, secret: string) {
    this.key = key
    this.secret = secret
  }

  /** Signs the string using the secret.
   *
   * @param {String} string
   * @returns {String}
   */
  async sign(string: string) {
    const enc = new TextEncoder()
    const algorithm = { name: "HMAC", hash: "SHA-256" }
    const key = await crypto.subtle.importKey("raw", enc.encode(this.secret), algorithm, false, [
      "sign",
      "verify",
    ])
    const signature = await crypto.subtle.sign(algorithm.name, key, enc.encode(string))
    return util.bufToHex(signature)
  }

  /** Checks if the string has correct signature.
   *
   * @param {String} string
   * @param {String} signature
   * @returns {Boolean}
   */
  async verify(string: string, signature: string) {
    return util.secureCompare(await this.sign(string), signature)
  }
}
