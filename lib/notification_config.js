import Config from "./config.js"

const DEFAULT_HOST = "nativepush-cluster1.pusher.com"
const API_PREFIX = "server_api"
const API_VERSION = "v1"

export default class NotificationConfig extends Config {
  constructor(options) {
    super(options)
    this.host = options.host || DEFAULT_HOST
  }

  prefixPath(subPath) {
    return (
      "/" + API_PREFIX + "/" + API_VERSION + "/apps/" + this.appId + subPath
    )
  }
}
