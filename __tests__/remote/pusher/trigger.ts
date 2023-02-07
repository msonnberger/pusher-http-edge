import Pusher from "../../../src/pusher"
import { describe, test, expect, beforeEach } from "@jest/globals"

describe.skip("Pusher (integration)", function () {
  let pusher: Pusher

  beforeEach(function () {
    pusher = Pusher.forURL(process.env.PUSHER_URL ?? "")
  })

  describe("#trigger", function () {
    test("should return code 200", function (done) {
      pusher
        // @ts-expect-error
        .trigger("integration", "event", "test", null)
        .then((response) => {
          expect(response.status).toEqual(200)
          return response.json().then((body) => {
            expect(body).toEqual({})
            done()
          })
        })
        .catch(done)
    })
  })

  describe("#triggerBatch", function () {
    test("should return code 200", function (done) {
      pusher
        .triggerBatch([
          {
            channel: "integration",
            name: "event",
            data: "test",
          },
          {
            channel: "integration2",
            name: "event2",
            data: "test2",
          },
        ])
        .then((response) => {
          expect(response.status).toEqual(200)
          return response.json().then((body) => {
            expect(body).toEqual({})
            done()
          })
        })
        .catch(done)
    })
  })
})
