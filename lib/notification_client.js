import * as requests from "./requests.js"
import NotificationConfig from "./notification_config.js"

export default class NotificationClient {
  constructor(options) {
    this.config = new NotificationConfig(options)
  }

  notify(interests, notification) {
    if (!Array.isArray(interests)) {
      throw new Error("Interests must be an array")
    }

    if (interests.length == 0) {
      throw new Error("Interests array must not be empty")
    }

    const body = Object.assign({ interests: interests }, notification)
    return requests.send(this.config, {
      method: "POST",
      body: body,
      path: "/notifications",
    })
  }
}
