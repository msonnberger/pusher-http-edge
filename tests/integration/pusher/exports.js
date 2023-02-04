import { expect, describe, test } from "vitest"

import * as errors from "../../../lib/errors.js"
import Pusher from "../../../lib/pusher.js"
import Token from "../../../lib/token.js"

describe("Pusher", () => {
  test("should export `Token`", () => {
    expect(Pusher.Token).toBe(Token)
  })

  test("should export `RequestError`", () => {
    expect(Pusher.RequestError).toBe(errors.RequestError)
  })

  test("should export `WebHookError`", () => {
    expect(Pusher.WebHookError).toBe(errors.WebHookError)
  })
})
