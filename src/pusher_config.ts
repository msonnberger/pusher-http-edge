import Config from "./config"
import { Options } from "./types"

export default class PusherConfig extends Config {
  constructor(options: Options) {
    super(options)

    if (options.host) {
      this.host = options.host
    } else if (options.cluster) {
      this.host = "api-" + options.cluster + ".pusher.com"
    } else {
      this.host = "api.pusherapp.com"
    }
  }

  prefixPath(subPath: string) {
    return "/apps/" + this.appId + subPath
  }
}
