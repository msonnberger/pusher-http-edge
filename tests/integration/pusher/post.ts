import { expect, beforeEach, afterEach, test, describe } from "vitest"
import nock from "nock"

import Pusher from "../../../src/pusher"

describe("Pusher", function () {
  let pusher: Pusher

  beforeEach(function () {
    pusher = new Pusher({ appId: 10000, key: "aaaa", secret: "tofu" })
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe("#post", function () {
    test("should set the correct path and include the body", async () => {
      nock("http://api.pusherapp.com")
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=12bf5995ac4b1285a6d87b2dafb92590&auth_signature=Y",
          { foo: "one", bar: [1, 2, 3], baz: 4321 }
        )
        .reply(200, "{}")

      const response = await pusher.post({
        path: "/test",
        body: { foo: "one", bar: [1, 2, 3], baz: 4321 },
      })

      expect(response.status).toEqual(200)
    })

    test("should set the request content type to application/json", async () => {
      nock("http://api.pusherapp.com", {
        reqheaders: {
          "content-type": "application/json",
          host: "api.pusherapp.com",
          "content-length": 2,
        },
      })
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
          {}
        )
        .reply(201, '{"returned key": 101010101}')

      const response = await pusher.post({ path: "/test", body: {} })

      expect(response.status).toEqual(201)
    })

    test("should resolve to the response", async () => {
      nock("http://api.pusherapp.com")
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
          {}
        )
        .reply(201, '{"returned key": 101010101}')

      const response = await pusher.post({ path: "/test", body: {} })
      expect(response.status).to.equal(201)
      const body = await response.text()
      expect(body).to.equal('{"returned key": 101010101}')
    })

    test("should reject with a RequestError if Pusher responds with 4xx", () => {
      nock("http://api.pusherapp.com")
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
          {}
        )
        .reply(403, "NOPE")

      const expectedError = new Pusher.RequestError(
        "Unexpected status code 403",
        "http://api.pusherapp.com/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
        undefined,
        403,
        "NOPE"
      )

      expect(pusher.post({ path: "/test", body: {} })).rejects.toEqual(
        expectedError
      )
    })

    test("should respect the encryption, host and port config", async () => {
      const pusher = new Pusher({
        appId: 10000,
        key: "aaaa",
        secret: "tofu",
        useTLS: true,
        host: "example.com",
        port: 1234,
      })
      nock("https://example.com:1234")
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
          {}
        )
        .reply(201, '{"returned key": 101010101}')

      const response = await pusher.post({ path: "/test", body: {} })

      expect(response.status).toEqual(201)
    })

    test("should respect the timeout when specified", async () => {
      const pusher = new Pusher({
        appId: 10000,
        key: "aaaa",
        secret: "tofu",
        timeout: 100,
      })
      nock("http://api.pusherapp.com")
        .filteringPath(function (path) {
          return path
            .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
            .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        })
        .post(
          "/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
          {}
        )
        .delayConnection(101)
        .reply(200)

      const expectedError = new Pusher.RequestError(
        "Request failed with an error",
        "http://api.pusherapp.com/apps/10000/test?auth_key=aaaa&auth_timestamp=X&auth_version=1.0&body_md5=99914b932bd37a50b983c5e7c90ae93b&auth_signature=Y",
        { name: "AbortError" },
        undefined,
        undefined
      )

      expect(pusher.post({ path: "/test", body: {} })).rejects.toEqual(
        expectedError
      )
    })
  })
})
