import * as errors from "./errors"
import * as util from "./util"

import pusherLibraryVersion from "./version"
import PusherConfig from "./pusher_config"
import { RequestOptions, SignedQueryStringOptions } from "./types"
import Token from "./token"

const RESERVED_QUERY_KEYS: { [key: string]: boolean } = {
  auth_key: true,
  auth_timestamp: true,
  auth_version: true,
  auth_signature: true,
  body_md5: true,
} as const

export async function send(
  config: PusherConfig,
  options: RequestOptions & { method: "GET" | "POST" }
) {
  const method = options.method
  const path = config.prefixPath(options.path)
  const body = options.body ? JSON.stringify(options.body) : undefined

  const url = `${config.getBaseURL()}${path}?${await createSignedQueryString(config.token, {
    method,
    path,
    params: options.params,
    body: body,
  })}`

  const headers = new Headers()
  headers.append("x-pusher-library", "pusher-http-node " + pusherLibraryVersion)

  if (body) {
    headers.append("content-type", "application/json")
  }

  let signal
  let timeout: number
  if (config.timeout) {
    const controller = new AbortController()
    timeout = (setTimeout(() => controller.abort(), config.timeout) as unknown) as number
    signal = controller.signal
  }

  return fetch(url, {
    method,
    body,
    headers,
    signal,
  }).then(
    (res) => {
      clearTimeout(timeout)
      if (res.status >= 400) {
        return res.text().then((body) => {
          throw new errors.RequestError(
            "Unexpected status code " + res.status,
            url,
            undefined,
            res.status,
            body
          )
        })
      }
      return res
    },
    (err) => {
      clearTimeout(timeout)
      throw new errors.RequestError("Request failed with an error", url, err)
    }
  )
}

export async function createSignedQueryString(token: Token, request: SignedQueryStringOptions) {
  const timestamp = (Date.now() / 1000) | 0

  const params: Record<string, any> = {
    auth_key: token.key,
    auth_timestamp: timestamp,
    auth_version: "1.0",
  }

  if (request.body) {
    params.body_md5 = util.getMD5(request.body)
  }

  if (request.params) {
    for (const key in request.params) {
      if (RESERVED_QUERY_KEYS[key] !== undefined) {
        throw Error(key + " is a required parameter and cannot be overidden")
      }
      params[key] = request.params[key]
    }
  }

  const method = request.method.toUpperCase()
  const sortedKeyVal = util.toOrderedArray(params)
  let queryString = sortedKeyVal.join("&")

  const signData = [method, request.path, queryString].join("\n")
  queryString += "&auth_signature=" + (await token.sign(signData))

  return queryString
}
