/** Contains information about an HTTP request error.
 *
 * @constructor
 * @extends Error
 * @param {String} message error message
 * @param {String} url request URL
 * @param [error] optional error cause
 * @param {Integer} [status] response status code, if received
 * @param {String} [body] response body, if received
 */
export class RequestError extends Error {
  url: string
  error: unknown
  status: number | undefined
  body: string | undefined

  constructor(message: string, url: string, error: unknown, status?: number, body?: string) {
    super(message)
    this.name = "PusherRequestError"

    /** @member {String} error message */
    this.message = message
    /** @member {String} request URL */
    this.url = url
    /** @member optional error cause */
    this.error = error
    /** @member {Integer} response status code, if received */
    this.status = status
    /** @member {String} response body, if received */
    this.body = body
  }
}

/** Contains information about a WebHook error.
 *
 * @constructor
 * @extends Error
 * @param {String} message error message
 * @param {String} contentType WebHook content type
 * @param {String} body WebHook body
 * @param {String} signature WebHook signature
 */
export class WebHookError extends Error {
  contentType: string
  body: string
  signature: string

  constructor(message: string, contentType: string, body: string, signature: string) {
    super(message)
    this.name = "PusherWebHookError"

    /** @member {String} error message */
    this.message = message
    /** @member {String} WebHook content type */
    this.contentType = contentType
    /** @member {String} WebHook body */
    this.body = body
    /** @member {String} WebHook signature */
    this.signature = signature
  }
}
