import Config from "./config.js"

export default class PusherConfig extends Config {
  constructor(options) {
    super(options)

    if (options.host) {
      this.host = options.host
    } else if (options.cluster) {
      this.host = "api-" + options.cluster + ".pusher.com"
    } else {
      this.host = "api.pusherapp.com"
    }
  }

  prefixPath(subPath) {
    return "/apps/" + this.appId + subPath
  }
}
