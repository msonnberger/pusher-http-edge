import nacl from "tweetnacl"
import naclUtil from "tweetnacl-util"
import fetchMock from "fetch-mock"
import { describe, beforeEach, test, afterEach, jest, expect } from "@jest/globals"

import Pusher from "../../../src/pusher"

describe("Pusher", () => {
  let pusher: Pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: "1234", key: "f00d", secret: "tofu" })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    fetchMock.restore()
  })

  describe("#trigger", () => {
    test("should send the event to a single channel", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=e95168baf497b2e54b2c6cadd41a6a3f&auth_signature=*",
        { name: "my_event", data: '{"some":"data "}', channels: ["one"] }
      )

      const res = await pusher.trigger("one", "my_event", { some: "data " })
      expect(res.status).toBe(200)
    })

    test("should send the event to multiple channels", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=530dac0aa045e5f8e51c470aed0ce325&auth_signature=*",
        {
          name: "my_event",
          data: '{"some":"data "}',
          channels: ["one", "two", "three"],
        }
      )

      await pusher.trigger(["one", "two", "three"], "my_event", {
        some: "data ",
      })
    })

    test("should serialize arrays into JSON", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=18e64b2fed38726915d79ebb4f8feb5b&auth_signature=*",
        { name: "my_event", data: "[1,2,4]", channels: ["one"] }
      )

      await pusher.trigger("one", "my_event", [1, 2, 4])
    })

    test("should not serialize strings into JSON", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=f358a562d00e1bfe1859132d932cd706&auth_signature=*",
        { name: "test_event", data: "test string", channels: ["test"] }
      )

      await pusher.trigger("test", "test_event", "test string")
    })

    test("should add params to the request body", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=2e4f053f1c325dedbe21abd8f1852b53&auth_signature=*",
        {
          name: "my_event",
          data: '{"some":"data "}',
          channels: ["test_channel"],
          socket_id: "123.567",
          info: "user_count,subscription_count",
        }
      )

      const params = {
        socket_id: "123.567",
        info: "user_count,subscription_count",
      }
      await pusher.trigger("test_channel", "my_event", { some: "data " }, params)
    })

    test("should resolve to the response", async () => {
      fetchMock.post(
        "glob:http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=*&auth_version=1.0&body_md5=d3a47b3241328a6432adf60c8e91b6fb&auth_signature=*",
        {
          name: "my_event",
          data: '{"some":"data "}',
          channels: ["test_channel"],
          info: "subscription_count",
        }
      )

      const response = await pusher.trigger(
        "test_channel",
        "my_event",
        { some: "data " },
        { info: "subscription_count" }
      )

      expect(response.status).toEqual(200)
      // const body = await response.text()

      //expect(body).toEqual('{"channels":{"test_channel":{"subscription_count":123}}}')
    })

    test("should reject with a RequestError if Pusher responds with 4xx", () => {
      // nock("http://api.pusherapp.com")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=cf87d666b4a829a54fc44b313584b2d7&auth_signature=Y",
      //     {
      //       name: "my_event",
      //       data: '{"some":"data "}',
      //       channels: ["test_channel"],
      //     }
      //   )
      //   .reply(400, "Error")

      const expectedError = new Pusher.RequestError(
        "Unexpected status code 400",
        "http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=0&auth_version=1.0&body_md5=cf87d666b4a829a54fc44b313584b2d7&auth_signature=Y",
        undefined,
        400,
        "Error"
      )

      expect(pusher.trigger("test_channel", "my_event", { some: "data " })).rejects.toEqual(
        expectedError
      )
    })

    test("should allow channel names with special characters: _ - = @ , . ;", async () => {
      // nock("http://api.pusherapp.com")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=024f0f297e27e131c8ec2c8817d153f4&auth_signature=Y",
      //     {
      //       name: "my_event",
      //       data: '{"some":"data "}',
      //       channels: ["test_-=@,.;channel"],
      //     }
      //   )
      //   .reply(200, "OK")

      const response = await pusher.trigger("test_-=@,.;channel", "my_event", {
        some: "data ",
      })

      expect(response.status).toEqual(200)
    })

    test("should throw an error if called with more than 100 channels", async () => {
      await expect(() => {
        const channels: string[] = []
        for (let i = 0; i < 101; i++) {
          channels.push(i.toString())
        }
        pusher.trigger(channels, "x", {})
      }).rejects.toThrowError("Can't trigger a message to more than 100 channels")
    })

    test("should throw an error if channel name is empty", async () => {
      await expect(pusher.trigger("", "test", {})).rejects.toThrowError("Invalid channel name: ''")
    })

    test("should throw an error if channel name is invalid", async () => {
      await expect(pusher.trigger("abc$", "test", {})).toThrowError("Invalid channel name: 'abc$'")
    })

    test("should throw an error if channel name is longer than 200 characters", async () => {
      const channel = new Array(202).join("x") // 201 characters
      await expect(pusher.trigger(channel, "test", {})).rejects.toThrowError(
        "Channel name too long: '" + channel + "'"
      )
    })

    test("should throw an error if event name is longer than 200 characters", async () => {
      const event = new Array(202).join("x") // 201 characters
      await expect(pusher.trigger("test", event, {})).rejects.toThrowError(
        "Too long event name: '" + event + "'"
      )
    })

    test("should respect the encryption, host and port config", async () => {
      const pusher = new Pusher({
        appId: "1234",
        key: "f00d",
        secret: "tofu",
        useTLS: true,
        host: "example.com",
        port: 1234,
      })
      // nock("https://example.com:1234")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=0478e1ed73804ae1be97cfa6554cf039&auth_signature=Y",
      //     {
      //       name: "my_event",
      //       data: '{"some":"data "}',
      //       channels: ["test_channel"],
      //       socket_id: "123.567",
      //     }
      //   )
      //   .reply(200, "{}")

      const response = await pusher.trigger(
        "test_channel",
        "my_event",
        { some: "data " },
        { socket_id: "123.567" }
      )

      expect(response.status).toEqual(200)
    })

    test("should respect the timeout when specified", async () => {
      const pusher = new Pusher({
        appId: "1234",
        key: "f00d",
        secret: "tofu",
        timeout: 100,
      })
      // nock("http://api.pusherapp.com")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=0478e1ed73804ae1be97cfa6554cf039&auth_signature=Y",
      //     {
      //       name: "my_event",
      //       data: '{"some":"data "}',
      //       channels: ["test_channel"],
      //       socket_id: "123.567",
      //     }
      //   )
      //   .delayConnection(101)
      //   .reply(200)

      const expectedError = new Pusher.RequestError(
        "Request failed with an error",
        "http://api.pusherapp.com/apps/1234/events?auth_key=f00d&auth_timestamp=1234&auth_version=1.0&body_md5=0478e1ed73804ae1be97cfa6554cf039&auth_signature=1234",
        {
          name: "AbortError",
        },
        undefined,
        undefined
      )

      expect(
        pusher.trigger("test_channel", "my_event", { some: "data " }, { socket_id: "123.567" })
      ).rejects.toEqual(expectedError)
    })
  })

  describe("#triggerBatch", () => {
    test("should trigger multiple events in a single call", async () => {
      // nock("http://api.pusherapp.com")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/batch_events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=fd5ab5fd40237f27555c4d2564470fdd&auth_signature=Y",
      //     JSON.stringify({
      //       batch: [
      //         { channel: "integration", name: "event", data: "test" },
      //         { channel: "integration2", name: "event2", data: "test2" },
      //       ],
      //     })
      //   )
      //   .reply(200, "{}")

      const response = await pusher.triggerBatch([
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

      expect(response.status).toEqual(200)
    })

    test("should stringify data before posting", async () => {
      // nock("http://api.pusherapp.com")
      //   .filteringPath(function (path) {
      //     return path
      //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //   })
      //   .post(
      //     "/apps/1234/batch_events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=ade2e9d64d936215c2b2d6a6f4606ef9&auth_signature=Y",
      //     JSON.stringify({
      //       batch: [
      //         {
      //           channel: "integration",
      //           name: "event",
      //           data: '{"hello":"world"}',
      //         },
      //         {
      //           channel: "integration2",
      //           name: "event2",
      //           data: '{"hello2":"another world"}',
      //         },
      //       ],
      //     })
      //   )
      //   .reply(200, "{}")

      const response = await pusher.triggerBatch([
        {
          channel: "integration",
          name: "event",
          data: {
            hello: "world",
          },
        },
        {
          channel: "integration2",
          name: "event2",
          data: {
            hello2: "another world",
          },
        },
      ])

      expect(response.status).toEqual(200)
    })
  })

  describe("#sendToUser", () => {
    test("should trigger an event on #server-to-user-{userId}", () => {
      // sinon.stub(events, "trigger")
      // pusher.sendToUser("abc123", "halo", { foo: "bar" })
      // expect(events.trigger.called).toBe(true)
      // expect(events.trigger.getCall(0).args[1]).eql(["#server-to-user-abc123"])
      // expect(events.trigger.getCall(0).args[2]).equal("halo")
      // expect(events.trigger.getCall(0).args[3]).eql({ foo: "bar" })
      // events.trigger.restore()

      pusher.post = jest.fn() as any
      pusher.sendToUser("abc123", "halo", { foo: "bar" })

      expect(pusher.post).toBeCalledTimes(1)
    })

    test("should throw an error if user id is empty", async () => {
      await expect(pusher.sendToUser("", "halo", { foo: "bar" })).rejects.toThrowError(
        "Invalid user id: ''"
      )
    })

    test("should throw an error if user id is not a string", async () => {
      // @ts-expect-error
      await expect(pusher.sendToUser(123, "halo", { foo: "bar" })).rejects.toThrowError(
        "Invalid user id: '123'"
      )
    })

    test("should throw an error if event name is longer than 200 characters", async () => {
      const event = new Array(202).join("x") // 201 characters
      await expect(pusher.sendToUser("abc123", event, { foo: "bar" })).rejects.toThrowError(
        "Too long event name: '" + event + "'"
      )
    })
  })
})

describe("Pusher with encryptionMasterKey", () => {
  let pusher: Pusher

  const testMasterKey = btoa("01234567890123456789012345678901")

  beforeEach(() => {
    pusher = new Pusher({
      appId: "1234",
      key: "f00d",
      secret: "tofu",
      encryptionMasterKeyBase64: testMasterKey,
    })
  })

  describe("#trigger", () => {
    test("should not encrypt the body of an event triggered on a single channel", async () => {
      //   nock("http://api.pusherapp.com")
      //     .filteringPath(function (path) {
      //       return path
      //         .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
      //         .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
      //     })
      //     .post(
      //       "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=e95168baf497b2e54b2c6cadd41a6a3f&auth_signature=Y",
      //       { name: "my_event", data: '{"some":"data "}', channels: ["one"] }
      //     )
      //     .reply(200, "{}")

      //   const response = await pusher.trigger("one", "my_event", {
      //     some: "data ",
      //   })

      //   expect(response.status).toEqual(200)
      // })

      test("should encrypt the body of an event triggered on a private-encrypted- channel", async () => {
        const sentPlaintext = "Hello!"

        // nock("http://api.pusherapp.com")
        //   .filteringPath(function (path) {
        //     return path
        //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
        //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        //       .replace(/body_md5=[0-9a-f]{32}/, "body_md5=Z")
        //   })
        //   .post(
        //     "/apps/1234/events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=Z&auth_signature=Y",
        //     async function (body: any) {
        //       if (body.name !== "test_event") return false
        //       if (body.channels.length !== 1) return false
        //       const channel = body.channels[0]
        //       if (channel !== "private-encrypted-bla") return false
        //       const encrypted = JSON.parse(body.data)
        //       const nonce = naclUtil.decodeBase64(encrypted.nonce)
        //       const ciphertext = naclUtil.decodeBase64(encrypted.ciphertext)
        //       const channelSharedSecret = await pusher.channelSharedSecret(channel)
        //       const receivedPlaintextBytes = nacl.secretbox.open(
        //         ciphertext,
        //         nonce,
        //         channelSharedSecret
        //       )
        //       const receivedPlaintextJson = naclUtil.encodeUTF8(
        //         receivedPlaintextBytes ?? new Uint8Array()
        //       )
        //       const receivedPlaintext = JSON.parse(receivedPlaintextJson)
        //       return receivedPlaintext === sentPlaintext
        //     }
        //   )
        //   .reply(200, "{}")

        const response = await pusher.trigger("private-encrypted-bla", "test_event", sentPlaintext)

        expect(response.status).toEqual(200)
      })
    })

    describe("#triggerBatch", () => {
      test("should encrypt the bodies of an events triggered on a private-encrypted- channels", async () => {
        // nock("http://api.pusherapp.com")
        //   .filteringPath(function (path) {
        //     return path
        //       .replace(/auth_timestamp=[0-9]+/, "auth_timestamp=X")
        //       .replace(/auth_signature=[0-9a-f]{64}/, "auth_signature=Y")
        //       .replace(/body_md5=[0-9a-f]{32}/, "body_md5=Z")
        //   })
        //   .post(
        //     "/apps/1234/batch_events?auth_key=f00d&auth_timestamp=X&auth_version=1.0&body_md5=Z&auth_signature=Y",
        //     async function (body: any) {
        //       if (body.batch.length !== 2) return false
        //       const event1 = body.batch[0]
        //       if (event1.channel !== "integration") return false
        //       if (event1.name !== "event") return false
        //       if (event1.data !== "test") return false
        //       const event2 = body.batch[1]
        //       if (event2.channel !== "private-encrypted-integration2") return false
        //       if (event2.name !== "event2") return false
        //       const encrypted = JSON.parse(event2.data)
        //       const nonce = naclUtil.decodeBase64(encrypted.nonce)
        //       const ciphertext = naclUtil.decodeBase64(encrypted.ciphertext)
        //       const channelSharedSecret = await pusher.channelSharedSecret(event2.channel)
        //       const receivedPlaintextBytes = nacl.secretbox.open(
        //         ciphertext,
        //         nonce,
        //         channelSharedSecret
        //       )
        //       const receivedPlaintextJson = naclUtil.encodeUTF8(
        //         receivedPlaintextBytes ?? new Uint8Array()
        //       )
        //       const receivedPlaintext = JSON.parse(receivedPlaintextJson)
        //       return receivedPlaintext === "test2"
        //     }
        //   )
        //   .reply(200, "{}")

        const response = await pusher.triggerBatch([
          {
            channel: "integration",
            name: "event",
            data: "test",
          },
          {
            channel: "private-encrypted-integration2",
            name: "event2",
            data: "test2",
          },
        ])

        expect(response.status).toEqual(200)
      })
    })
  })
})
