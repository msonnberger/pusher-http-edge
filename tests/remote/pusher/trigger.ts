import { expect, describe, test, beforeEach } from "vitest"

import Pusher from "../../../src/pusher"

describe.skip("Pusher (integration)", function () {
  let pusher: Pusher

  beforeEach(function () {
    pusher = new Pusher.forURL(process.env.PUSHER_URL)
  })

  describe("#trigger", function () {
    test("should return code 200", function (done) {
      pusher
        .trigger("integration", "event", "test", null)
        .then((response) => {
          expect(response.status).to.equal(200)
          return response.json().then((body) => {
            expect(body).to.eql({})
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
          expect(response.status).to.equal(200)
          return response.json().then((body) => {
            expect(body).to.eql({})
            done()
          })
        })
        .catch(done)
    })
  })
})
