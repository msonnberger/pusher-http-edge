import * as errors from "./errors.js"

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
  constructor(token, request) {
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
  isValid(extraTokens) {
    if (!this.isBodyValid()) {
      return false
    }

    extraTokens = extraTokens || []
    if (!(extraTokens instanceof Array)) {
      extraTokens = [extraTokens]
    }

    const tokens = [this.token].concat(extraTokens)
    for (const i in tokens) {
      const token = tokens[i]
      if (this.key == token.key && token.verify(this.body, this.signature)) {
        return true
      }
    }
    return false
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
