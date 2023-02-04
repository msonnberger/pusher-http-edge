import { describe, expect, afterEach, beforeEach, test } from "vitest"
import NotificationClient from "../../../lib/notification_client.js"
import nock from "nock"

describe("NativeNotificationClient", () => {
  let client

  beforeEach(() => {
    client = new NotificationClient({
      appId: 1234,
      key: "f00d",
      secret: "tofu",
    })
    nock.cleanAll()
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test.skip("should send in the success case", (done) => {
    const mock = nock("nativepush-cluster1.pusher.com:80")
    client.notify(
      ["yolo"],
      {
        apns: {
          aps: {
            alert: {
              title: "yolo",
              body: "woot",
            },
          },
        },
        gcm: {
          notification: {
            title: "huzzah",
            icon: "woot",
          },
        },
      },
      function () {
        expect(mock.isDone()).toBe(true)
        done()
      }
    )
  })
})
