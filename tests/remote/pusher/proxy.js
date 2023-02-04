import expect from "expect.js"

import HttpsProxyAgent from "https-proxy-agent"

import http_proxy from "../../helpers/http_proxy.js"
import Pusher from "../../../lib/pusher.js"

describe("Pusher (integration)", function () {
  describe("with configured proxy", function () {
    let pusher
    let proxy

    before(function (done) {
      proxy = http_proxy.start(done)
    })

    beforeEach(function () {
      pusher = new Pusher.forURL(process.env.PUSHER_URL, {
        agent: new HttpsProxyAgent("http://localhost:8321"),
      })
    })

    afterEach(function () {
      proxy.requests = 0
    })

    after(function (done) {
      http_proxy.stop(proxy, done)
    })

    describe("#get", function () {
      it("should go through the proxy", function (done) {
        expect(proxy.requests).to.equal(0)
        pusher
          .get({ path: "/channels" })
          .then((response) => {
            expect(proxy.requests).to.equal(1)
            expect(response.status).to.equal(200)
            response.json().then((body) => {
              expect(body.channels).to.be.an(Object)
              done()
            })
          })
          .catch(done)
      })
    })

    describe("#trigger", function () {
      it("should go through the proxy", function (done) {
        expect(proxy.requests).to.equal(0)
        pusher
          .trigger("integration", "event", "test", null)
          .then((response) => {
            expect(proxy.requests).to.equal(1)
            expect(response.status).to.equal(200)
            response.json().then((body) => {
              expect(body).to.eql({})
              done()
            })
          })
          .catch(done)
      })
    })
  })
})
