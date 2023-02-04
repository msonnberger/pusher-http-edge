import { expect, describe, afterEach, beforeEach, test, vi } from "vitest"

import Pusher from "../../../lib/pusher.js"

describe("Pusher", () => {
  let pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: 1234, key: "f00d", secret: "tofu" })
  })

  describe("#createSignedQueryString", () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: 1234567890000, toFake: ["Date"] })
    })

    afterEach(() => {
      vi.clearAllTimers()
    })

    describe("when signing a body", () => {
      test("should set the auth_key param to the app key", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          body: "example body",
        })
        expect(queryString).toMatch(/^(.*&)?auth_key=f00d(&.*)?$/)
      })

      test("should set the auth_timestamp param to the current timestamp (in seconds)", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          body: "example body",
        })
        // Date.now is mocked
        expect(queryString).toMatch(/^(.*&)?auth_timestamp=1234567890(&.*)?$/)
      })

      test("should set the auth_version param to 1.0", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          body: "example body",
        })
        expect(queryString).toMatch(/^(.*&)?auth_version=1\.0(&.*)?$/)
      })

      test("should set the body_md5 param to a correct hash", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          body: "example body",
        })
        expect(queryString).toMatch(
          /^(.*&)?body_md5=165d5e6d7ca8f73b3853ce45addf42fc(&.*)?$/
        )
      })

      test("should set the auth_signature to a correct hash", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          body: "example body",
        })
        // Date.now is mocked, so the signature can be hardcoded
        expect(queryString).toMatch(
          /^(.*&)?auth_signature=a650196dc427ebe837226f8565ca9232198c6d1b9455eaa72374a9dc0b620e7b(&.*)?$/
        )
      })
    })

    describe("when signing params", () => {
      test("should set the auth_key param to the app key", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          params: { foo: "bar" },
        })
        expect(queryString).toMatch(/^(.*&)?auth_key=f00d(&.*)?$/)
      })

      test("should set the auth_timestamp param to the current timestamp (in seconds)", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          params: { foo: "bar" },
        })
        // Date.now is mocked
        expect(queryString).toMatch(/^(.*&)?auth_timestamp=1234567890(&.*)?$/)
      })

      test("should set the auth_version param to 1.0", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          params: { foo: "bar" },
        })
        expect(queryString).toMatch(/^(.*&)?auth_version=1\.0(&.*)?$/)
      })

      test("should set all given params", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          params: { foo: "bar", baz: 123454321 },
        })
        expect(queryString).toMatch(/^(.*&)?foo=bar(&.*)?$/)
        expect(queryString).toMatch(/^(.*&)?baz=123454321(&.*)?$/)
      })

      test("should set the auth_signature to a correct hash", () => {
        const queryString = pusher.createSignedQueryString({
          method: "GET",
          path: "/event",
          params: { foo: "bar", baz: 123454321 },
        })
        // Date.now is mocked, so the signature can be hardcoded
        expect(queryString).toMatch(
          /^(.*&)?auth_signature=d8bdbd31911fb7400a14fbd36fd7de053494725b64400ae5856deafe304b34a9(&.*)?$/
        )
      })

      test("should raise an expcetion when overriding the auth_key param", () => {
        expect(() => {
          pusher.createSignedQueryString({
            method: "GET",
            path: "/event",
            params: { auth_key: "NOPE" },
          })
        }).toThrowError(
          /^auth_key is a required parameter and cannot be overidden$/
        )
      })

      test("should raise an expcetion when overriding the auth_timestamp param", () => {
        expect(() => {
          pusher.createSignedQueryString({
            method: "GET",
            path: "/event",
            params: { auth_timestamp: "NOPE" },
          })
        }).toThrowError(
          /^auth_timestamp is a required parameter and cannot be overidden$/
        )
      })

      test("should raise an expcetion when overriding the auth_version param", () => {
        expect(() => {
          pusher.createSignedQueryString({
            method: "GET",
            path: "/event",
            params: { auth_version: "NOPE" },
          })
        }).toThrowError(
          /^auth_version is a required parameter and cannot be overidden$/
        )
      })

      test("should raise an expcetion when overriding the auth_signature param", () => {
        expect(() => {
          pusher.createSignedQueryString({
            method: "GET",
            path: "/event",
            params: { auth_signature: "NOPE" },
          })
        }).toThrowError(
          /^auth_signature is a required parameter and cannot be overidden$/
        )
      })
    })
  })
})
