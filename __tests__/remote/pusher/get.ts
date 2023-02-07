import Pusher from "../../../src/pusher"
import { describe, test, expect, beforeEach } from "@jest/globals"

describe("Pusher (integration)", function () {
  let pusher: Pusher

  beforeEach(function () {
    pusher = Pusher.forURL(process.env.PUSHER_URL ?? "")
  })

  describe.skip("#get", function () {
    describe("/channels", function () {
      test("should return channels as an object", function (done) {
        pusher
          .get({ path: "/channels" })
          .then((response) => {
            expect(response.status).toEqual(200)
            return response.json().then((body) => {
              expect(body.channels).toBeInstanceOf(Object)
              done()
            })
          })
          .catch(done)
      })
    })

    describe("/channels/CHANNEL", function () {
      test("should return if the channel is occupied", function (done) {
        pusher
          .get({ path: "/channels/CHANNEL" })
          .then((response) => {
            expect(response.status).toEqual(200)
            return response.json().then((body) => {
              expect(body.occupied).toBeInstanceOf(Boolean)
              done()
            })
          })
          .catch(done)
      })
    })

    describe("/channels/CHANNEL/users", function () {
      test("should return code 400 for non-presence channels", function (done) {
        pusher.get({ path: "/channels/CHANNEL/users" }).catch((error) => {
          expect(error).toBeInstanceOf(Pusher.RequestError)
          expect(error.message).toEqual("Unexpected status code 400")
          expect(error.status).toEqual(400)
          done()
        })
      })
    })
  })
})
