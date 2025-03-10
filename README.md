## ⚠️ Disclaimer ⚠️

This is a fork of Pusher's HTTP Node.js Library, replacing Node APIs with native Web APIs available in the Edge Runtime for usage with Vercel or Netlify Edge Functions.

Please be aware that it has not been tested thoroughly yet and is _not_ production ready.

# Pusher Channels Edge Runtime REST library

In order to use this library, you need to have an account on <https://pusher.com/channels>. After registering, you will need the application credentials for your app.

## Supported platforms

This SDK supports the JavaScript [Edge Runtime](https://edge-runtime.vercel.app/).

If you find any compatibility issues, please [raise an issue](https://github.com/msonnberger/pusher-http-edge/issues/new) in the repository.

## Installation

```
$ npm install pusher-http-edge
```

## Importing

It's possible to use pusher-http-edge with TypeScript or JavaScript.

```typescript
import Pusher from "pusher-http-edge"
```

## Configuration

There are 3 ways to configure the client. First one is just using the Pusher constructor:

```javascript
import Pusher from "pusher-http-edge"

const pusher = new Pusher({
  appId: "APP_ID",
  key: "APP_KEY",
  secret: "SECRET_KEY",
  useTLS: USE_TLS, // optional, defaults to false
  cluster: "CLUSTER", // if `host` is present, it will override the `cluster` option.
  host: "HOST", // optional, defaults to api.pusherapp.com
  port: PORT, // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
  encryptionMasterKeyBase64: ENCRYPTION_MASTER_KEY, // a base64 string which encodes 32 bytes, used to derive the per-channel encryption keys (see below!)
})
```

For specific clusters, you can use the `forCluster` function. This is the same as using the `cluster` option in the constructor.

```javascript
import Pusher from "pusher-http-edge"

const pusher = Pusher.forCluster("CLUSTER", {
  appId: "APP_ID",
  key: "APP_KEY",
  secret: "SECRET_KEY",
  useTLS: USE_TLS, // optional, defaults to false
  port: PORT, // optional, defaults to 80 for non-TLS connections and 443 for TLS connections
  encryptionMasterKeyBase64: ENCRYPTION_MASTER_KEY, // a base64 string which encodes 32 bytes, used to derive the per-channel encryption keys (see below!)
})
```

You can also specify auth and endpoint options by passing an URL:

```javascript
import Pusher from "pusher-http-edge"

const pusher = Pusher.forURL("SCHEME://APP_KEY:SECRET_KEY@HOST:PORT/apps/APP_ID")
```

You can pass the optional second argument with options, as in `forCluster` function.

This is useful for example on Heroku, which sets the PUSHER_URL environment
variable to such URL, if you have the Pusher Addon installed.

#### Additional options

There are a few additional options that can be used in all above methods:

```javascript
import Pusher from "pusher-http-edge"

const pusher = new Pusher({
  // you can set other options in any of the 3 ways described above
  timeout: TIMEOUT, // optional, timeout for all requests in milliseconds
  keepAlive: KEEP_ALIVE, // optional, enables keep-alive, defaults to false
})
```

## Usage

### Callbacks and error handling

#### API requests

Asynchronous methods on the `Pusher` class (`trigger`, `get` and `post`) return a promise that resolves to a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response), or rejects with an error.

All operational errors are wrapped into a `Pusher.RequestError` object.

#### WebHooks

In case accessing data for invalid WebHooks, a `Pusher.WebHookError` exception will be thrown from the called method. It is recommended to validate the WebHook before interpreting it.

### Publishing events

To send an event to one or more channels use the trigger function. Channel names can contain only characters which are alphanumeric, '\_' or '-' and have to be at most 200 characters long. Event name can be at most 200 characters long too.

#### Single channel

```javascript
pusher.trigger("channel-1", "test_event", { message: "hello world" })
```

#### Multiple channels

To trigger an event on multiple channels:

```javascript
pusher.trigger(["channel-1", "channel-2"], "test_event", {
  message: "hello world",
})
```

You can trigger an event to at most 100 channels at once. Passing more than 100 channels will cause an exception to be thrown.

#### Batch events

If you wish to send multiple events in a single HTTP request, you can pass an array of events to `pusher.triggerBatch`. You can send up to a maximum of 10 events at once.

```javascript
const events = [
  {
    channel: "channel-1",
    name: "test-event-1",
    data: { message: "hello world" },
  },
  {
    channel: "channel-2",
    name: "test-event-2",
    data: { message: "hello another world" },
  },
]

pusher.triggerBatch(events)
```

You can trigger a batch of up to 10 events.

#### Sending events to Authenticated Users

Events can be triggered to [Authenticated Users](#Authenticating-users)

```javascript
pusher.sendToUser("user-1", "test_event", { message: "hello world" })
```

### Excluding event recipients

In order to avoid the client that triggered the event from also receiving it, a `socket_id` parameter can be added to the `params` object. For more information see: <http://pusher.com/docs/publisher_api_guide/publisher_excluding_recipients>.

```javascript
pusher.trigger(channel, event, data, { socket_id: "1302.1081607" })

pusher.triggerBatch([{ channel: channel, name: name, data: data, socket_id: "1302.1081607" }])
```

### Fetch subscriber and user counts at the time of publish [[EXPERIMENTAL](https://pusher.com/docs/lab#experimental-program)]

For the channels that were published to, you can request for the number of subscribers or user to be returned in the response body.

#### Regular triggering

```javascript
try {
  const response = await pusher.trigger("presence-my-channel", "event", "test", {
    info: "user_count,subscription_count",
  })

  if (response.status !== 200) {
    throw Error("unexpected status")
  }
  // Parse the response body as JSON
  const body = await response.json()

  const channelsInfo = body.channels
} catch (error) {
  // handle errors
}
```

#### Batch triggering

```javascript
const batch = [
  {
    channel: "my-channel",
    name: "event",
    data: "test1",
    info: "subscription_count",
  },
  {
    channel: "presence-my-channel",
    name: "event",
    data: "test2",
    info: "user_count,subscription_count",
  },
]
pusher
  .triggerBatch(batch)
  .then((response) => {
    if (response.status !== 200) {
      throw Error("unexpected status")
    }
    // Parse the response body as JSON
    return response.json()
  })
  .then((body) => {
    body.batch.forEach((attributes, i) => {
      process.stdout.write(
        `channel: ${batch[i].channel}, name: ${batch[i].name}, subscription_count: ${attributes.subscription_count}`
      )
      if ("user_count" in attributes) {
        process.stdout.write(`, user_count: ${attributes.user_count}`)
      }
      process.stdout.write("\n")
    })
  })
  .catch((error) => {
    console.error(error)
  })
```

### End-to-end encryption

This library supports end-to-end encryption of your private channels. This means that only you and your connected clients will be able to read your messages. Pusher cannot decrypt them. You can enable this feature by following these steps:

1. You should first set up Private channels. This involves [creating an authorization endpoint on your server](https://pusher.com/docs/authenticating_users).

2. Next, generate your 32 byte master encryption key, encode it as base64 and pass it to the Pusher constructor.

   This is secret and you should never share this with anyone.
   Not even Pusher.

   ```bash
   openssl rand -base64 32
   ```

   ```javascript
   const pusher = new Pusher({
     appId: "APP_ID",
     key: "APP_KEY",
     secret: "SECRET_KEY",
     useTLS: true,
     encryptionMasterKeyBase64: "<KEY GENERATED BY PREVIOUS COMMAND>",
   })
   ```

3. Channels where you wish to use end-to-end encryption should be prefixed with `private-encrypted-`.

4. Subscribe to these channels in your client, and you're done! You can verify it is working by checking out the debug console on the [https://dashboard.pusher.com/](dashboard) and seeing the scrambled ciphertext.

**Important note: This will **not** encrypt messages on channels that are not prefixed by `private-encrypted-`.**

**Limitation**: you cannot trigger a single event on multiple channels in a call to `trigger`, e.g.

```javascript
pusher.trigger(["channel-1", "private-encrypted-channel-2"], "test_event", {
  message: "hello world",
})
```

Rationale: the methods in this library map directly to individual Channels HTTP API requests. If we allowed triggering a single event on multiple channels (some encrypted, some unencrypted), then it would require two API requests: one where the event is encrypted to the encrypted channels, and one where the event is unencrypted for unencrypted channels.

### Authenticating users

To authenticate users during sign in, you can use the `authenticateUser` function:

```javascript
const userData = {
  id: "unique_user_id",
  name: "John Doe",
  image: "https://...",
}

const auth = await pusher.authenticateUser(socketId, userData)
```

The `userData` parameter must contain an `id` property with a non empty string. For more information see: <http://pusher.com/docs/authenticating_users>

### Terminating user connections

In order to terminate a user's connections, the user must have been authenticated. Check the [Server user authentication docs](http://pusher.com/docs/authenticating_users) for the information on how to create a user authentication endpoint.

To terminate all connections established by a given user, you can use the `terminateUserConnections` function:

```javascript
await pusher.terminateUserConnections(userId)
```

Please note, that it only terminates the user's active connections. This means, if nothing else is done, the user will be able to reconnect. For more information see: [Terminating user connections docs](https://pusher.com/docs/channels/server_api/terminating-user-connections/).

### Private channel authorisation

To authorise your users to access private channels on Pusher Channels, you can use the `authorizeChannel` function:

```javascript
const auth = await pusher.authorizeChannel(socketId, channel)
```

For more information see: <http://pusher.com/docs/authenticating_users>

### Presence channel authorisation

Using presence channels is similar to private channels, but you can specify extra data to identify that particular user:

```javascript
const channelData = {
  user_id: 'unique_user_id',
  user_info: {
    name: 'Phil Leggetter'
    twitter_id: '@leggetter'
  }
};
const auth = await pusher.authorizeChannel(socketId, channel, channelData);
```

The `auth` is then returned to the caller as JSON.

For more information see: <http://pusher.com/docs/authenticating_users>

### Application state

It's possible to query the state of the application using the `pusher.get` function.

```javascript
pusher.get({ path: path, params: params })
```

The `path` property identifies the resource that the request should be made to and the `params` property should be a map of additional query string key and value pairs.

Params can't include following keys:

- auth_key
- auth_timestamp
- auth_version
- auth_signature
- body_md5

The following example shows how to handle the result of a `get`:

```javascript
pusher
  .get({ path: "/channels", params: {} })
  .then(response => {
    if (response.status !== 200) {
      throw Error("unexpected status")
    }
    // Parse the response body as JSON
    return response.json()
  )
  .then(body => {
    const channelsInfo = body.channels
    // Do something with channelsInfo
  })
  .catch(error => {
    // Handle error
  })
})
```

#### Get the list of channels in an application

```javascript
pusher.get({ path: "/channels", params: params })
```

Information on the optional `params` and the structure of the returned JSON is defined in the [REST API reference](http://pusher.com/docs/rest_api#method-get-channels).

#### Get the state of a channel

```javascript
pusher.get({ path: "/channels/[channel_name]", params: params })
```

Information on the optional `params` option property and the structure of the returned JSON is defined in the [REST API reference](http://pusher.com/docs/rest_api#method-get-channel).

#### Get the list of users in a presence channel

```javascript
pusher.get({ path: "/channels/[channel_name]/users" })
```

The `channel_name` in the path must be a [presence channel](http://pusher.com/docs/presence). The structure of the returned JSON is defined in the [REST API reference](http://pusher.com/docs/rest_api#method-get-users).

### WebHooks

The library provides a simple helper for WebHooks, which can be accessed via Pusher instances:

```javascript
const webhook = pusher.webhook(request)
```

Requests must expose following fields:

- headers - object with request headers indexed by lowercase header names
- rawBody - string with the WebHook request body

Headers object must contain following headers:

- x-pusher-key - application key, sent by Channels
- x-pusher-signature - WebHook signature, generated by Channels
- content-type - must be set to application/json, what Channels does

After instantiating the WebHook object, you can use its following methods:

#### isValid

Validates the content type, body format and signature of the WebHook and returns a boolean. Your application should validate incoming webhooks, otherwise they could be faked.

Accepts an optional parameter containing additional application tokens (useful e.g. during migrations):

```javascript
const webhook = pusher.webhook(request)
// will check only the key and secret assigned to the pusher object:
await webhook.isValid()
// will also check two additional tokens:
await webhook.isValid([
  { key: "x1", secret: "y1" },
  { key: "x2", secret: "y2" },
])
```

#### getData

Returns the parsed WebHook body. Throws a Pusher.WebHookError if the WebHook is invalid, so please check the `isValid` result before accessing the data.

```javascript
// will return an object with the WebHook data
webhook.getData()
```

Please read [the WebHooks documentation](http://pusher.com/docs/webhooks) to find out what fields are included in the body.

#### getEvents

Returns events included in the WebHook as an array. Throws a Pusher.WebHookError if the WebHook is invalid, so please check the `isValid` result before accessing the events.

```javascript
// will return an array with the events
webhook.getEvents()
```

#### getTime

Returns the Date object for the time when the WebHook was sent from Channels. Throws a `Pusher.WebHookError` if the WebHook is invalid, so please check the `isValid` result before accessing the time.

```javascript
// will return a Date object
webhook.getTime()
```

### Generating REST API signatures

If you wanted to send the REST API requests manually (e.g. using a different HTTP client), you can use the `createSignedQueryString` method to generate the whole request query string that includes the auth keys and your parameters.

```javascript
pusher.createSignedQueryString({
  method: "POST", // the HTTP request method
  path: "/apps/3/events", // the HTTP request path
  body: '{"name":"foo","channel":"donuts","data":"2-for-1"}', // optional, the HTTP request body
  params: {}, // optional, the query params
})
```

The `params` object can't contain following keys, as they are used to sign the request:

- auth_key
- auth_timestamp
- auth_version
- auth_signature
- body_md5

## License

This code is free to use under the terms of the MIT license.
