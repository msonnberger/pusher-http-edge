import { expect, describe, beforeEach, afterEach, test } from "vitest"
import nock from "nock"

import Pusher from "../../../lib/pusher.js"

describe("Pusher", () => {
  let pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: 999, key: "111111", secret: "tofu" })
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe("#get", () => {
    test("should set the correct path and include all params", async () => {
      nock("http://api.pusherapp.com")
        .filteringPath((path) => {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .get(
          "/apps/999/channels?auth_key=111111&auth_timestamp=X&auth_version=1.0&filter_by_prefix=presence-&info=user_count,subscription_count&auth_signature=Y"
        )
        .reply(200, "{}")

      await pusher.get({
        path: "/channels",
        params: {
          filter_by_prefix: "presence-",
          info: "user_count,subscription_count",
        },
      })
    })

    test("should resolve to the response", async () => {
      nock("http://api.pusherapp.com")
        .filteringPath((path) => {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .get(
          "/apps/999/test?auth_key=111111&auth_timestamp=X&auth_version=1.0&auth_signature=Y"
        )
        .reply(200, '{"test key": "test value"}')

      const response = await pusher.get({ path: "/test", params: {} })
      expect(response.status).toEqual(200)
      const body = await response.text()
      expect(body).toEqual('{"test key": "test value"}')
    })

    test("should reject with a RequestError if Pusher responds with 4xx", async () => {
      nock("http://api.pusherapp.com")
        .filteringPath((path) => {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .get(
          "/apps/999/test?auth_key=111111&auth_timestamp=X&auth_version=1.0&auth_signature=Y"
        )
        .reply(400, "Error")

      const expectedError = new Pusher.RequestError(
        "Unexpected status code 400",
        "http://api.pusherapp.com/apps/999/test?auth_key=111111&auth_timestamp=1610000000&auth_version=1.0&auth_signature=00000000000000000000",
        "Error",
        400,
        "Error"
      )
      expect(pusher.get({ path: "/test", params: {} })).rejects.toEqual(
        expectedError
      )
    })

    test("should respect the encryption, host and port config", () => {
      const pusher = new Pusher({
        appId: 999,
        key: "111111",
        secret: "tofu",
        useTLS: true,
        host: "example.com",
        port: 1234,
      })
      nock("https://example.com:1234")
        .filteringPath((path) => {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .get(
          "/apps/999/test?auth_key=111111&auth_timestamp=X&auth_version=1.0&auth_signature=Y"
        )
        .reply(200, '{"test key": "test value"}')

      pusher.get({ path: "/test", params: {} })
    })

    test("should respect the timeout when specified", () => {
      const pusher = new Pusher({
        appId: 999,
        key: "111111",
        secret: "tofu",
        timeout: 100,
      })
      nock("http://api.pusherapp.com")
        .filteringPath((path) => {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .get(
          "/apps/999/test?auth_key=111111&auth_timestamp=X&auth_version=1.0&auth_signature=Y"
        )
        .delayConnection(101)
        .reply(200)

      const expectedError = new Pusher.RequestError(
        "Request failed with an error",
        "http://api.pusherapp.com/apps/999/test?auth_key=111111&auth_timestamp=1610000000&auth_version=1.0&auth_signature=0000000",
        { error: { name: "AbortError" } },
        undefined,
        undefined
      )

      expect(pusher.get({ path: "/test", params: {} })).rejects.toEqual(
        expectedError
      )
    })
  })
})
