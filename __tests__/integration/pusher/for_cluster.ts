import Pusher from "../../../src/pusher"
import { describe, test, expect } from "@jest/globals"

describe("Pusher", () => {
  describe(".forCluster", () => {
    test("should generate a hostname for the cluster", () => {
      // @ts-expect-error
      const pusher = Pusher.forCluster("test")
      expect(pusher.config.host).toEqual("api-test.pusher.com")
    })

    test("should override the hostname if set in the extra options", () => {
      // @ts-expect-error
      const pusher = Pusher.forCluster("eu", {
        host: "api.staging.pusher.com",
      })
      expect(pusher.config.host).toEqual("api-eu.pusher.com")
    })

    test("should use the cluster option passed as first param not the option", () => {
      // @ts-expect-error
      const pusher = Pusher.forCluster("eu", {
        cluster: "mt1",
      })
      expect(pusher.config.host).toEqual("api-eu.pusher.com")
    })
  })
})
