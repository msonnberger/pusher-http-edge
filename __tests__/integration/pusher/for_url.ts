import Pusher from "../../../src/pusher"
import { describe, test, expect } from "@jest/globals"

describe("Pusher", () => {
  describe(".forUrl", () => {
    test("should set the `appId` attribute", () => {
      const pusher = Pusher.forURL("https://123abc:def456@example.org/apps/4321")
      expect(pusher.config.appId).toEqual("4321")
    })

    test("should set the `token` attribute", () => {
      const pusher = Pusher.forURL("https://123abc:def456@example.org/apps/4321")
      expect(pusher.config.token.key).toEqual("123abc")
      expect(pusher.config.token.secret).toEqual("def456")
    })

    test("should set the `scheme` attribute", () => {
      const pusher = Pusher.forURL("https://123abc:def456@example.org/apps/4321")
      expect(pusher.config.scheme).toEqual("https")
    })

    test("should set the `host` attribute", () => {
      const pusher = Pusher.forURL("https://123abc:def456@example.org/apps/4321")
      expect(pusher.config.host).toEqual("example.org")
    })

    test("should set the `port` attribute if specified", () => {
      const pusher = Pusher.forURL("https://123abc:def456@example.org:999/apps/4321")
      expect(pusher.config.port).toEqual(999)
    })

    test("should default the `port` attribute to undefined", () => {
      const pusher = Pusher.forURL("http://123abc:def456@example.org/apps/4321")
      expect(pusher.config.port).toBe(undefined)
    })
  })
})
