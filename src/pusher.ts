import * as auth from "./auth.js"
import * as errors from "./errors.js"
import * as events from "./events.js"
import * as requests from "./requests.js"

import PusherConfig from "./pusher_config.js"
import Token from "./token.js"
import WebHook from "./webhook.js"

import {
  Options,
  TriggerParams,
  WebHookRequest,
  UserChannelData,
  BatchEvent,
  PostOptions,
  GetOptions,
  SignedQueryStringOptions,
} from "./types.js"

function validateChannel(channel: string) {
  if (typeof channel !== "string" || channel === "" || channel.match(/[^A-Za-z0-9_\-=@,.;]/)) {
    throw new Error("Invalid channel name: '" + channel + "'")
  }
  if (channel.length > 200) {
    throw new Error("Channel name too long: '" + channel + "'")
  }
}

function validateSocketId(socketId: string) {
  if (typeof socketId !== "string" || socketId === "" || !socketId.match(/^\d+\.\d+$/)) {
    throw new Error("Invalid socket id: '" + socketId + "'")
  }
}

function validateUserId(userId: string) {
  if (typeof userId !== "string" || userId === "") {
    throw new Error("Invalid user id: '" + userId + "'")
  }
}

function validateUserData(userData: UserChannelData) {
  if (userData == null || typeof userData !== "object") {
    throw new Error("Invalid user data: '" + userData + "'")
  }
  validateUserId(userData.id)
}

/** Provides access to Pusher's REST API, WebHooks and authentication.
 *
 * @constructor
 * @param  options
 * @param [options.host="api.pusherapp.com"] API hostname
 * @param [options.notification_host="api.pusherapp.com"] Notification API hostname
 * @param [options.useTLS=false] whether to use TLS
 * @param [options.notification_encrypted=false] whether to use TLS for notifications
 * @param [options.port] port, default depends on the scheme
 * @param options.appId application ID
 * @param options.key application key
 * @param options.secret application secret
 * @param [options.timeout] request timeout in milliseconds
 * @param [options.agent] http agent to use
 */
export default class Pusher {
  config: PusherConfig

  constructor(options: Options) {
    this.config = new PusherConfig(options)
  }

  /** Create a Pusher instance using a URL.
   *
   * URL should be in SCHEME://APP_KEY:SECRET_KEY@HOST:PORT/apps/APP_ID form.
   */
  static forURL(pusherUrl: string, options?: Options): Pusher {
    const apiUrl = new URL(pusherUrl)
    const apiPath = apiUrl.pathname.split("/")

    return new Pusher({
      ...options,
      useTLS: apiUrl.protocol.replace(/:$/, "") === "https",
      host: apiUrl.hostname,
      port: parseInt(apiUrl.port, 10) || undefined,
      appId: apiPath[apiPath.length - 1],
      key: apiUrl.username,
      secret: apiUrl.password,
    })
  }

  /** Create a Pusher instance using a cluster name. */
  static forCluster(cluster: string, options: Options) {
    return new Pusher({
      ...options,
      host: "api-" + cluster + ".pusher.com",
    })
  }

  /** Returns a signature for given socket id, channel and socket data.
   *
   * @param socketId socket id
   * @param channel channel name
   * @param [data] additional socket data
   * @returns authorization signature
   */
  async authorizeChannel(socketId: string, channel: string, data?: UserChannelData) {
    validateSocketId(socketId)
    validateChannel(channel)

    return auth.getSocketSignature(this, this.config.token, channel, socketId, data)
  }

  /** Returns a signature for given socket id and user data.
   *
   * @param socketId socket id
   * @param userData user data
   * @returns authentication signature
   */
  async authenticateUser(socketId: string, userData: UserChannelData) {
    validateSocketId(socketId)
    validateUserData(userData)

    return auth.getSocketSignatureForUser(this.config.token, socketId, userData)
  }

  /** Sends an event to a user.
   *
   * Event name can be at most 200 characters long.
   *
   * @param userId user id
   * @param event event name
   * @param data event data, objects are JSON-encoded
   * @returns {Promise} a promise resolving to a response, or rejecting to a RequestError.
   * @see RequestError
   */
  async sendToUser(userId: string, event: string, data: any) {
    if (event.length > 200) {
      throw new Error("Too long event name: '" + event + "'")
    }
    validateUserId(userId)
    return events.trigger(this, [`#server-to-user-${userId}`], event, data)
  }

  /** Terminate users's connections.
   *
   *
   * @param userId user id
   * @returns a promise resolving to a response, or rejecting to a RequestError.
   * @see RequestError
   */
  async terminateUserConnections(userId: string) {
    validateUserId(userId)
    return this.post({
      path: `/users/${userId}/terminate_connections`,
      body: {},
    })
  }

  /** Triggers an event.
   *
   * Channel names can contain only characters which are alphanumeric, '_' or '-'
   * and have to be at most 200 characters long.
   *
   * Event name can be at most 200 characters long.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param channel list of at most 100 channels
   * @param event event name
   * @param data event data, objects are JSON-encoded
   * @param [params] additional optional request body parameters
   * @param [params.socket_id] id of a socket that should not receive the event
   * @param [params.info] a comma separate list of attributes to be returned in the response. Experimental, see https://pusher.com/docs/lab#experimental-program
   * @see RequestError
   */
  async trigger(channels: string | string[], event: string, data: any, params?: TriggerParams) {
    if (params && params.socket_id) {
      validateSocketId(params.socket_id)
    }
    if (!(channels instanceof Array)) {
      // add single channel to array for multi trigger compatibility
      channels = [channels]
    }
    if (event.length > 200) {
      throw new Error("Too long event name: '" + event + "'")
    }
    if (channels.length > 100) {
      throw new Error("Can't trigger a message to more than 100 channels")
    }
    for (let i = 0; i < channels.length; i++) {
      validateChannel(channels[i])
    }
    return events.trigger(this, channels, event, data, params)
  }

  /* Triggers a batch of events
   *
   * @param {Event[]} An array of events, where Event is
   * {
   *   name: string,
   *   channel: string,
   *   data: any JSON-encodable data,
   *   socket_id: [optional] string,
   *   info: [optional] string experimental, see https://pusher.com/docs/lab#experimental-program
   * }
   */
  async triggerBatch(batch: BatchEvent[]) {
    return events.triggerBatch(this, batch)
  }

  /** Makes a POST request to Pusher, handles the authentication.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param {Object} options
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @param {String} options.body request body
   * @see RequestError
   */
  async post(options: PostOptions) {
    return requests.send(this.config, { ...options, method: "POST" })
  }

  /** Makes a GET request to Pusher, handles the authentication.
   *
   * Returns a promise resolving to a response, or rejecting to a RequestError.
   *
   * @param {Object} options
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @see RequestError
   */
  async get(options: GetOptions) {
    return requests.send(this.config, { ...options, method: "GET" })
  }

  /** Creates a WebHook object for a given request.
   *
   * @param {Object} request
   * @param {Object} request.headers WebHook HTTP headers with lower-case keys
   * @param {String} request.rawBody raw WebHook body
   * @returns {WebHook}
   */
  webhook(request: WebHookRequest) {
    return new WebHook(this.config.token, request)
  }

  /** Builds a signed query string that can be used in a request to Pusher.
   *
   * @param {Object} options
   * @param {String} options.method request method
   * @param {String} options.path request path
   * @param {Object} options.params query params
   * @param {String} options.body request body
   * @returns {String} signed query string
   */
  async createSignedQueryString(options: SignedQueryStringOptions) {
    return requests.createSignedQueryString(this.config.token, options)
  }

  async channelSharedSecret(channel: string) {
    if (this.config.encryptionMasterKey === undefined) {
      throw new Error("Encryption master key is not set")
    }

    const channelArray = new TextEncoder().encode(channel)
    const data = new Uint8Array(channelArray.length + this.config.encryptionMasterKey.length)
    data.set(channelArray)
    data.set(this.config.encryptionMasterKey, channelArray.length)

    const buf = await crypto.subtle.digest("SHA-256", data)
    return new Uint8Array(buf)
  }

  /** Exported {@link Token} constructor. */
  static Token = Token
  /** Exported {@link RequestError} constructor. */
  static RequestError = errors.RequestError
  /** Exported {@link WebHookError} constructor. */
  static WebHookError = errors.WebHookError
}
