import Pusher from "../../../src/pusher"
import { describe, test, expect } from "@jest/globals"

describe("Pusher", () => {
  describe("constructor attributes", () => {
    test("should support `appId`", () => {
      // @ts-expect-error
      const pusher = new Pusher({ appId: "12345" })
      expect(pusher.config.appId).toEqual("12345")
    })

    test("should support `token`", () => {
      // @ts-expect-error
      const pusher = new Pusher({
        key: "1234567890abcdef",
        secret: "fedcba0987654321",
      })
      expect(pusher.config.token.key).toEqual("1234567890abcdef")
      expect(pusher.config.token.secret).toEqual("fedcba0987654321")
    })

    test("should default `useTLS` to false", () => {
      // @ts-expect-error
      const pusher = new Pusher({})
      expect(pusher.config.scheme).toEqual("http")
    })

    test("should support `useTLS`", () => {
      // @ts-expect-error
      const pusher = new Pusher({ useTLS: true })
      expect(pusher.config.scheme).toEqual("https")
    })

    test("should default `host` to 'api.pusherapp.com'", () => {
      // @ts-expect-error
      const pusher = new Pusher({})
      expect(pusher.config.host).toEqual("api.pusherapp.com")
    })

    test("should support `host`", () => {
      // @ts-expect-error
      const pusher = new Pusher({ host: "example.org" })
      expect(pusher.config.host).toEqual("example.org")
    })

    test("should support `cluster`", () => {
      // @ts-expect-error
      const pusher = new Pusher({ cluster: "eu" })
      expect(pusher.config.host).toEqual("api-eu.pusher.com")
    })

    test("should have `host` override `cluster`", () => {
      // @ts-expect-error
      const pusher = new Pusher({
        host: "api.staging.pusher.com",
        cluster: "eu",
      })
      expect(pusher.config.host).toEqual("api.staging.pusher.com")
    })

    test("should default `port` to undefined", () => {
      // @ts-expect-error
      const pusher = new Pusher({ useTLS: true })
      expect(pusher.config.port).toBe(undefined)
    })

    test("should support `port`", () => {
      // @ts-expect-error
      let pusher = new Pusher({ port: 8080 })
      expect(pusher.config.port).toEqual(8080)

      // @ts-expect-error
      pusher = new Pusher({ useTLS: true, port: 8080 })
      expect(pusher.config.port).toEqual(8080)
    })

    test("should default `timeout` to `undefined`", () => {
      // @ts-expect-error
      const pusher = new Pusher({})
      expect(pusher.config.timeout).toBe(undefined)
    })

    test("should support `timeout`", () => {
      // @ts-expect-error
      const pusher = new Pusher({ timeout: 1001 })
      expect(pusher.config.timeout).toEqual(1001)
    })

    test("should support `encryptionMasterKeyBase64` which decodes to 32 bytes", () => {
      const key = "01234567890123456789012345678901"
      const keyBase64 = btoa(key)
      // @ts-expect-error
      const pusher = new Pusher({ encryptionMasterKeyBase64: keyBase64 })
      expect(new TextDecoder().decode(pusher.config.encryptionMasterKey)).toEqual(key)
    })

    test("should reject `encryptionMasterKeyBase64` which decodes to 31 bytes", () => {
      const key = "0123456789012345678901234567890"
      const keyBase64 = btoa(key)
      expect(() => {
        // @ts-expect-error
        new Pusher({ encryptionMasterKeyBase64: keyBase64 })
      }).toThrowError(/31 bytes/)
    })

    test("should reject `encryptionMasterKeyBase64` which decodes to 33 bytes", () => {
      const key = "012345678901234567890123456789012"
      const keyBase64 = btoa(key)
      expect(() => {
        // @ts-expect-error
        new Pusher({ encryptionMasterKeyBase64: keyBase64 })
      }).toThrowError(/33 bytes/)
    })

    test("should reject `encryptionMasterKeyBase64` which is invalid base64", () => {
      const keyBase64 = "aGkgd(GhlcmUK"
      expect(() => {
        // @ts-expect-error
        new Pusher({ encryptionMasterKeyBase64: keyBase64 })
      }).toThrowError(/valid base64/)
    })
  })
})
