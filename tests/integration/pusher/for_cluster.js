import { expect, describe, test } from "vitest"

import Pusher from "../../../lib/pusher.js"

describe("Pusher", () => {
  describe(".forCluster", () => {
    test("should generate a hostname for the cluster", () => {
      const pusher = Pusher.forCluster("test")
      expect(pusher.config.host).toEqual("api-test.pusher.com")
    })

    test("should override the hostname if set in the extra options", () => {
      const pusher = Pusher.forCluster("eu", {
        host: "api.staging.pusher.com",
      })
      expect(pusher.config.host).toEqual("api-eu.pusher.com")
    })

    test("should use the cluster option passed as first param not the option", () => {
      const pusher = Pusher.forCluster("eu", {
        cluster: "mt1",
      })
      expect(pusher.config.host).toEqual("api-eu.pusher.com")
    })
  })
})
