import expect from "expect.js"

import * as errors from "../../../lib/errors.js"
import Pusher from "../../../lib/pusher.js"
import Token from "../../../lib/token.js"

describe("Pusher", function () {
  it("should export `Token`", function () {
    expect(Pusher.Token).to.be(Token)
  })

  it("should export `RequestError`", function () {
    expect(Pusher.RequestError).to.be(errors.RequestError)
  })

  it("should export `WebHookError`", function () {
    expect(Pusher.WebHookError).to.be(errors.WebHookError)
  })
})
