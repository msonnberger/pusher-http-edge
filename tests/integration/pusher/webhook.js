import { expect, describe, test, beforeEach } from "vitest"

import Pusher from "../../../lib/pusher.js"
import WebHook from "../../../lib/webhook.js"

describe("Pusher", () => {
  let pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: 10000, key: "aaaa", secret: "tofu" })
  })

  describe("#webhook", () => {
    test("should return a WebHook instance", () => {
      expect(pusher.webhook({ headers: {}, body: "" })).toBeInstanceOf(WebHook)
    })

    test("should pass the token to the WebHook", () => {
      expect(pusher.webhook({ headers: {}, body: "" }).token).toBe(
        pusher.config.token
      )
    })
  })
})
