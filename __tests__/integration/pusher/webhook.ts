import Pusher from "../../../src/pusher"
import WebHook from "../../../src/webhook"
import { describe, test, expect, beforeEach } from "@jest/globals"

describe("Pusher", () => {
  let pusher: Pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: "10000", key: "aaaa", secret: "tofu" })
  })

  describe("#webhook", () => {
    test("should return a WebHook instance", () => {
      expect(pusher.webhook({ headers: {}, rawBody: "" })).toBeInstanceOf(WebHook)
    })

    test("should pass the token to the WebHook", () => {
      expect(pusher.webhook({ headers: {}, rawBody: "" }).token).toBe(pusher.config.token)
    })
  })
})
