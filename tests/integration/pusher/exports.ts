import { expect, describe, test } from "vitest"

import * as errors from "../../../src/errors"
import Pusher from "../../../src/pusher"
import Token from "../../../src/token"

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
