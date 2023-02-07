import Pusher from "../../../src/pusher"
import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"

describe("Pusher", () => {
  let pusher: Pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: "1234", key: "f00d", secret: "tofu" })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("#terminateUserConnections", () => {
    test("should throw an error if user id is empty", async () => {
      await expect(pusher.terminateUserConnections("")).rejects.toThrowError("Invalid user id: ''")
    })

    test("should throw an error if user id is not a string", async () => {
      // @ts-expect-error
      await expect(pusher.terminateUserConnections(123)).rejects.toThrowError(
        "Invalid user id: '123'"
      )
    })
  })

  test("should call /terminate_connections endpoint", async () => {
    pusher.post = jest.fn() as any
    pusher.config.appId = "1234"
    const userId = "testUserId"

    await pusher.terminateUserConnections(userId)

    expect(pusher.post).toHaveBeenNthCalledWith(1, {
      path: `/users/${userId}/terminate_connections`,
      body: {},
    })
  })
})
