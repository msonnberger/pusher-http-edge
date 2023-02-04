import expect from "expect.js"

import Pusher from "../../../lib/pusher.js"
import WebHook from "../../../lib/webhook.js"

describe("Pusher", function () {
  let pusher

  beforeEach(function () {
    pusher = new Pusher({ appId: 10000, key: "aaaa", secret: "tofu" })
  })

  describe("#webhook", function () {
    it("should return a WebHook instance", function () {
      expect(pusher.webhook({ headers: {}, body: "" })).to.be.a(WebHook)
    })

    it("should pass the token to the WebHook", function () {
      expect(pusher.webhook({ headers: {}, body: "" }).token).to.be(
        pusher.config.token
      )
    })
  })
})
