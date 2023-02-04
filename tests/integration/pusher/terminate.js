import { expect, describe, beforeEach, afterEach, test, vi } from "vitest"

import Pusher from "../../../lib/pusher.js"

describe("Pusher", () => {
  let pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: 1234, key: "f00d", secret: "tofu" })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("#terminateUserConnections", () => {
    test("should throw an error if user id is empty", () => {
      expect(() => {
        pusher.terminateUserConnections("")
      }).toThrowError("Invalid user id: ''")
    })

    test("should throw an error if user id is not a string", () => {
      expect(() => {
        pusher.terminateUserConnections(123)
      }).toThrowError("Invalid user id: '123'")
    })
  })

  test("should call /terminate_connections endpoint", async () => {
    pusher.post = vi.fn()
    pusher.appId = 1234
    const userId = "testUserId"

    pusher.terminateUserConnections(userId)

    expect(pusher.post).toHaveBeenNthCalledWith(1, {
      path: `/users/${userId}/terminate_connections`,
      body: {},
    })
  })
})
