import { describe, expect, test, beforeEach } from "@jest/globals"

import Pusher from "../../src/pusher"
import Token from "../../src/token"
import WebHook from "../../src/webhook"

describe("WebHook", () => {
  let token: Token

  beforeEach(() => {
    token = new Token("123456789", "tofu")
  })

  describe("#isValid", () => {
    test("should return true for a webhook with correct signature", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "x-pusher-key": "123456789",
          "x-pusher-signature": "c17257e92037cd7de407ebc1ed174ceb7b2e518db127f44411b9ffc4f5b28cc5",
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({
          time_ms: 1403175510755,
          events: [{ channel: "test_channel", name: "channel_vacated" }],
        }),
      })
      expect(await webhook.isValid()).toBe(true)
    })

    test("should return false for a webhook with incorrect key", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "x-pusher-key": "000",
          "x-pusher-signature": "df1465f5ff93f83238152fd002cb904f9562d39569e68f00a6bfa0d8ccf88334",
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({
          time_ms: 1403175510755,
          events: [{ channel: "test_channel", name: "channel_vacated" }],
        }),
      })
      expect(await webhook.isValid()).toBe(false)
    })

    test("should return false for a webhook with incorrect signature", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "x-pusher-key": "123456789",
          "x-pusher-signature": "000",
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({
          time_ms: 1403175510755,
          events: [{ channel: "test_channel", name: "channel_vacated" }],
        }),
      })
      expect(await webhook.isValid()).toBe(false)
    })

    test("should return true if webhook is signed with the extra token", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "x-pusher-key": "1234",
          "x-pusher-signature": "c17257e92037cd7de407ebc1ed174ceb7b2e518db127f44411b9ffc4f5b28cc5",
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({
          time_ms: 1403175510755,
          events: [{ channel: "test_channel", name: "channel_vacated" }],
        }),
      })
      expect(await webhook.isValid(new Token("1234", "tofu"))).toBe(true)
    })

    test("should return true if webhook is signed with one of the extra tokens", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "x-pusher-key": "3",
          "x-pusher-signature": "c17257e92037cd7de407ebc1ed174ceb7b2e518db127f44411b9ffc4f5b28cc5",
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({
          time_ms: 1403175510755,
          events: [{ channel: "test_channel", name: "channel_vacated" }],
        }),
      })
      expect(
        await webhook.isValid([
          new Token("1", "nope"),
          new Token("2", "not really"),
          new Token("3", "tofu"),
        ])
      ).toBe(true)
    })
  })

  describe("#isContentTypeValid", () => {
    test("should return true if content type is `application/json`", async () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({}),
      })
      expect(webhook.isContentTypeValid()).toBe(true)
    })

    test("should return false if content type is not `application/json`", () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/weird",
        },
        rawBody: JSON.stringify({}),
      })
      expect(webhook.isContentTypeValid()).toBe(false)
    })
  })

  describe("#isBodyValid", () => {
    test("should return true if content type is `application/json` and body is valid JSON", () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/json",
        },
        rawBody: JSON.stringify({}),
      })
      expect(webhook.isBodyValid()).toBe(true)
    })

    test("should return false if content type is `application/json` and body is not valid JSON", () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/json",
        },
        rawBody: "not json!",
      })
      expect(webhook.isBodyValid()).toBe(false)
    })

    test("should return false if content type is not `application/json`", () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/weird",
        },
        rawBody: JSON.stringify({}),
      })
      expect(webhook.isContentTypeValid()).toBe(false)
    })
  })

  describe("#getData", () => {
    test("should return a parsed JSON body", () => {
      const webhook = new WebHook(token, {
        headers: { "content-type": "application/json" },
        rawBody: JSON.stringify({ foo: 9 }),
      })
      expect(webhook.getData()).toEqual({ foo: 9 })
    })

    test("should throw an error if content type is not `application/json`", () => {
      const body = JSON.stringify({ foo: 9 })
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/weird",
          "x-pusher-signature": "f000000",
        },
        rawBody: body,
      })

      const expectedError = new Pusher.WebHookError(
        "Invalid WebHook body",
        "application/weird",
        body,
        "f000000"
      )
      expect(() => {
        webhook.getData()
      }).toThrowError(expectedError)
    })

    test("should throw an error if body is not valid JSON", () => {
      const webhook = new WebHook(token, {
        headers: {
          "content-type": "application/json",
          "x-pusher-signature": "b00",
        },
        rawBody: "not json",
      })
      const expectedError = new Pusher.WebHookError(
        "Invalid WebHook body",
        "application/json",
        "not json",
        "b00"
      )

      expect(() => {
        webhook.getData()
      }).toThrowError(expectedError)
    })
  })

  describe("#getTime", () => {
    test("should return a correct date object", () => {
      const webhook = new WebHook(token, {
        headers: { "content-type": "application/json" },
        rawBody: JSON.stringify({ time_ms: 1403172023361 }),
      })
      expect(webhook.getTime()).toEqual(new Date(1403172023361))
    })
  })

  describe("#getEvents", () => {
    test("should return an array of events", () => {
      const webhook = new WebHook(token, {
        headers: { "content-type": "application/json" },
        rawBody: JSON.stringify({
          events: [1, 2, 3],
        }),
      })
      expect(webhook.getEvents()).toEqual([1, 2, 3])
    })
  })
})
