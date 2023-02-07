import * as errors from "./errors.js"
import Token from "./token.js"
import { WebHookRequest } from "./types.js"

/** Provides validation and access methods for a WebHook.
 *
 * Before accessing WebHook data, check if it's valid. Otherwise, exceptions
 * will be raised from access methods.
 *
 * @constructor
 * @param {Token} primary token
 * @param {Object} request
 * @param {Object} request.headers WebHook HTTP headers with lower-case keys
 * @param {String} request.rawBody raw WebHook body
 */
export default class WebHook {
  token: Token
  key: string
  signature: string
  contentType: string
  body: string
  data: any

  constructor(token: Token, request: WebHookRequest) {
    this.token = token

    this.key = request.headers["x-pusher-key"]
    this.signature = request.headers["x-pusher-signature"]
    this.contentType = request.headers["content-type"]
    this.body = request.rawBody

    if (this.isContentTypeValid()) {
      try {
        // Try to parse as JSON
        this.data = JSON.parse(this.body)
      } catch (e) {
        // Do nothing
      }
    }
  }

  /** Checks whether the WebHook has valid body and signature.
   *
   * @param {Token|Token[]} list of additional tokens to be validated against
   * @returns {Boolean}
   */
  async isValid(extraTokens?: Token | Token[]) {
    if (!this.isBodyValid()) {
      return false
    }

    extraTokens = extraTokens || []
    if (!(extraTokens instanceof Array)) {
      extraTokens = [extraTokens]
    }

    const tokens = [this.token].concat(extraTokens)

    if (!tokens.some((token) => token.key === this.key)) {
      return false
    }

    const promises = tokens.map((token) => {
      return token.verify(this.body, this.signature)
    })

    const results = await Promise.all(promises)

    return results.some((result) => result)
  }

  /** Checks whether the WebHook content type is valid.
   *
   * For now, the only valid WebHooks have content type of application/json.
   *
   * @returns {Boolean}
   */
  isContentTypeValid() {
    return this.contentType === "application/json"
  }

  /** Checks whether the WebHook content type and body is JSON.
   *
   * @returns {Boolean}
   */
  isBodyValid() {
    return this.data !== undefined
  }

  /** Returns all WebHook data.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Object}
   */
  getData() {
    if (!this.isBodyValid()) {
      throw new errors.WebHookError(
        "Invalid WebHook body",
        this.contentType,
        this.body,
        this.signature
      )
    }
    return this.data
  }

  /** Returns WebHook events array.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Object[]}
   */
  getEvents() {
    return this.getData().events
  }

  /** Returns WebHook timestamp.
   *
   * @throws WebHookError when WebHook is invalid
   * @returns {Date}
   */
  getTime() {
    return new Date(this.getData().time_ms)
  }
}
