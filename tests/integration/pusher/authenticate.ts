import { describe, expect, test, beforeEach } from "vitest"

import Pusher from "../../../src/pusher"

describe("Pusher", () => {
  let pusher: Pusher

  beforeEach(() => {
    pusher = new Pusher({ appId: 10000, key: "aaaa", secret: "tofu" })
  })

  describe("#authenticateUser", () => {
    test("should prefix the signature with the app key", () => {
      let pusher = new Pusher({ appId: 10000, key: "1234", secret: "tofu" })
      expect(pusher.authenticateUser("123.456", { id: "45678" })).toEqual({
        auth:
          "1234:f4b1fdeea7c93e32648c7230e32b172057c5623cace6cfce791c6e7035e0babd",
        user_data: '{"id":"45678"}',
      })

      pusher = new Pusher({ appId: 10000, key: "abcdef", secret: "tofu" })
      expect(pusher.authenticateUser("123.456", { id: "45678" })).toEqual({
        auth:
          "abcdef:f4b1fdeea7c93e32648c7230e32b172057c5623cace6cfce791c6e7035e0babd",
        user_data: '{"id":"45678"}',
      })
    })

    test("should return correct authentication signatures for different user data", () => {
      expect(pusher.authenticateUser("123.456", { id: "45678" })).toEqual({
        auth:
          "aaaa:f4b1fdeea7c93e32648c7230e32b172057c5623cace6cfce791c6e7035e0babd",
        user_data: '{"id":"45678"}',
      })
      expect(
        pusher.authenticateUser("123.456", { id: "55555", user_name: "test" })
      ).toEqual({
        auth:
          "aaaa:b8a9f173455903792ae2b788add0c4c78ad7372b3ae7fb5769479276a1993743",
        user_data: JSON.stringify({ id: "55555", user_name: "test" }),
      })
    })

    test("should return correct authentication signatures for different secrets", () => {
      let pusher = new Pusher({ appId: 10000, key: "11111", secret: "1" })
      expect(pusher.authenticateUser("123.456", { id: "45678" })).toEqual({
        auth:
          "11111:79bddf29fe8e2153dd5d8d569b3f45e5aeb26ae2eb4758879d844791b466cfa2",
        user_data: '{"id":"45678"}',
      })
      pusher = new Pusher({ appId: 10000, key: "11111", secret: "2" })
      expect(pusher.authenticateUser("123.456", { id: "45678" })).toEqual({
        auth:
          "11111:a542498ffa6faf6de7c17a8106b923c042319bd73acfd1d274df32e269b55d1f",
        user_data: '{"id":"45678"}',
      })
    })

    test("should return correct authentication signature with utf-8 in user data", () => {
      expect(pusher.authenticateUser("1.1", { id: "ą§¶™€łü€ß£" })).toEqual({
        auth:
          "aaaa:620494cee53d6c568b49598313194088afda37218f0d059af03c0c898ed61ff4",
        user_data: '{"id":"ą§¶™€łü€ß£"}',
      })
    })

    test("should raise an exception if socket id is not a string", () => {
      expect(() => {
        pusher.authenticateUser(undefined!, { id: "123" })
      }).toThrowError(/^Invalid socket id: 'undefined'$/)
      expect(() => {
        pusher.authenticateUser(null!, { id: "123" })
      }).toThrowError(/^Invalid socket id: 'null'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser(111, { id: "123" })
      }).toThrowError(/^Invalid socket id: '111'$/)
    })

    test("should raise an exception if socket id is an empty string", () => {
      expect(() => {
        pusher.authenticateUser("", { id: "123" })
      }).toThrowError(/^Invalid socket id: ''$/)
    })

    test("should raise an exception if socket id is invalid", () => {
      expect(() => {
        pusher.authenticateUser("1.1:", { id: "123" })
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authenticateUser(":1.1", { id: "123" })
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authenticateUser(":\n1.1", { id: "123" })
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authenticateUser("1.1\n:", { id: "123" })
      }).toThrowError(/^Invalid socket id/)
    })

    test("should raise an exception if user data is not a non-null object", () => {
      expect(() => {
        pusher.authenticateUser("111.222", undefined!)
      }).toThrowError(/^Invalid user data: 'undefined'$/)
      expect(() => {
        pusher.authenticateUser("111.222", null!)
      }).toThrowError(/^Invalid user data: 'null'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser("111.222", 111)
      }).toThrowError(/^Invalid user data: '111'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser("111.222", "")
      }).toThrowError(/^Invalid user data: ''$/)
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser("111.222", "abc")
      }).toThrowError(/^Invalid user data: 'abc'$/)
    })

    test("should raise an exception if user data doesn't have a valid id field", () => {
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser("111.222", {})
      }).toThrowError(/^Invalid user id: 'undefined'$/)
      expect(() => {
        pusher.authenticateUser("111.222", { id: "" })
      }).toThrowError(/^Invalid user id: ''$/)
      expect(() => {
        // @ts-expect-error
        pusher.authenticateUser("111.222", { id: 123 })
      }).toThrowError(/^Invalid user id: '123'$/)
    })
  })

  describe("#authorizeChannel", () => {
    test("should prefix the signature with the app key", () => {
      let pusher = new Pusher({ appId: 10000, key: "1234", secret: "tofu" })
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "1234:efa6cf7644a0b35cba36aa0f776f3cbf7bb60e95ea2696bde1dbe8403b61bd7c",
      })

      pusher = new Pusher({ appId: 10000, key: "abcdef", secret: "tofu" })
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "abcdef:efa6cf7644a0b35cba36aa0f776f3cbf7bb60e95ea2696bde1dbe8403b61bd7c",
      })
    })

    test("should return correct authentication signatures for different socket ids", () => {
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "aaaa:efa6cf7644a0b35cba36aa0f776f3cbf7bb60e95ea2696bde1dbe8403b61bd7c",
      })
      expect(pusher.authorizeChannel("321.654", "test")).toEqual({
        auth:
          "aaaa:f6ecb0a17d3e4f68aca28f1673197a7608587c09deb0208faa4b5519aee0a777",
      })
    })

    test("should return correct authentication signatures for different channels", () => {
      expect(pusher.authorizeChannel("123.456", "test1")).toEqual({
        auth:
          "aaaa:d5ab857f805433cb50562da96afa41688d7742a3c3a021ed15a4d991a4d8cf94",
      })
      expect(pusher.authorizeChannel("123.456", "test2")).toEqual({
        auth:
          "aaaa:43affa6a09af1fb9ce1cadf176171346beaf7366673ec1e5920f68b3e97a466d",
      })
    })

    test("should return correct authentication signatures for different secrets", () => {
      let pusher = new Pusher({ appId: 10000, key: "11111", secret: "1" })
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "11111:584828bd6e80b2d177d2b28fde07b8e170abf87ccb5a791a50c933711fb8eb28",
      })
      pusher = new Pusher({ appId: 10000, key: "11111", secret: "2" })
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "11111:269bbf3f7625db4e0d0525b617efa5915c3ae667fd222dc8e4cb94bc531f26f2",
      })
    })

    test("should return the channel data", () => {
      expect(
        // @ts-expect-error
        pusher.authorizeChannel("123.456", "test", { foo: "bar" }).channel_data
      ).toEqual('{"foo":"bar"}')
    })

    test("should return correct authentication signatures with and without the channel data", () => {
      expect(pusher.authorizeChannel("123.456", "test")).toEqual({
        auth:
          "aaaa:efa6cf7644a0b35cba36aa0f776f3cbf7bb60e95ea2696bde1dbe8403b61bd7c",
      })
      expect(
        // @ts-expect-error
        pusher.authorizeChannel("123.456", "test", { foo: "bar" })
      ).toEqual({
        auth:
          "aaaa:f41faf9ead2ea76772cc6b1168363057459f02499ae4d92e88229dc7f4efa2d4",
        channel_data: '{"foo":"bar"}',
      })
    })

    test("should return correct authentication signature with utf-8 in channel data", () => {
      // @ts-expect-error
      expect(pusher.authorizeChannel("1.1", "test", "ą§¶™€łü€ß£")).toEqual({
        auth:
          "aaaa:2a229263e89d9c50524fd80c2e88be2843379f6931e28995e2cc214282c9db0c",
        channel_data: '"ą§¶™€łü€ß£"',
      })
    })

    test("should raise an exception if socket id is not a string", () => {
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel(undefined, "test")
      }).toThrowError(/^Invalid socket id: 'undefined'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel(null, "test")
      }).toThrowError(/^Invalid socket id: 'null'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel(111, "test")
      }).toThrowError(/^Invalid socket id: '111'$/)
    })

    test("should raise an exception if socket id is an empty string", () => {
      expect(() => {
        pusher.authorizeChannel("", "test")
      }).toThrowError(/^Invalid socket id: ''$/)
    })

    test("should raise an exception if socket id is invalid", () => {
      expect(() => {
        pusher.authorizeChannel("1.1:", "test")
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authorizeChannel(":1.1", "test")
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authorizeChannel(":\n1.1", "test")
      }).toThrowError(/^Invalid socket id/)
      expect(() => {
        pusher.authorizeChannel("1.1\n:", "test")
      }).toThrowError(/^Invalid socket id/)
    })

    test("should raise an exception if channel name is not a string", () => {
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel("111.222", undefined)
      }).toThrowError(/^Invalid channel name: 'undefined'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel("111.222", null)
      }).toThrowError(/^Invalid channel name: 'null'$/)
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel("111.222", 111)
      }).toThrowError(/^Invalid channel name: '111'$/)
    })

    test("should raise an exception if channel name is an empty string", () => {
      expect(() => {
        pusher.authorizeChannel("111.222", "")
      }).toThrowError(/^Invalid channel name: ''$/)
    })

    test("should throw an error for private-encrypted- channels", () => {
      expect(() => {
        // @ts-expect-error
        pusher.authorizeChannel("123.456", "private-encrypted-bla", "foo")
      }).toThrowError(
        "Cannot generate shared_secret because encryptionMasterKey is not set"
      )
    })
  })
})

describe("Pusher with encryptionMasterKey", () => {
  let pusher: Pusher

  const testMasterKeyBase64 = "zyrm8pvV2C9fJcBfhyXzvxbJVN/H7QLmbe0xJi1GhPU="

  beforeEach(() => {
    pusher = new Pusher({
      appId: 1234,
      key: "f00d",
      secret: "tofu",
      encryptionMasterKeyBase64: testMasterKeyBase64,
    })
  })

  describe("#authorizeChannel", () => {
    test("should return a shared_secret for private-encrypted- channels", () => {
      expect(
        // @ts-expect-error
        pusher.authorizeChannel("123.456", "private-encrypted-bla", "foo")
      ).toEqual({
        auth:
          "f00d:962c48b78bf93d98ff4c92ee7dff04865821455b7b401e9d60a9e0a90af2c105",
        channel_data: '"foo"',
        shared_secret: "nlr49ISQHz91yS3cy/yWmW8wFMNeTnNL5tNHnbPJcLQ=",
      })
    })
    test("should not return a shared_secret for non-encrypted channels", () => {
      // @ts-expect-error
      expect(pusher.authorizeChannel("123.456", "bla", "foo")).toEqual({
        auth:
          "f00d:013ad3da0d88e0df6ae0a8184bef50b9c3933f2344499e6e3d1ad67fad799e20",
        channel_data: '"foo"',
      })
    })
  })
})
