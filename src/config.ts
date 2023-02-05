import Token from "./token"
import isBase64 from "is-base64"
import { Options } from "./types"
import naclUtil from "tweetnacl-util"

export default class Config {
  scheme: string
  host?: string
  port?: number
  appId: string
  token: Token
  timeout?: number
  agent: any
  encryptionMasterKey?: Uint8Array

  constructor(options: Options) {
    options = options || {}

    let useTLS = false
    if (options.useTLS !== undefined) {
      useTLS = options.useTLS
    }
    this.scheme = useTLS ? "https" : "http"
    this.port = options.port

    this.appId = options.appId
    this.token = new Token(options.key, options.secret)

    this.timeout = options.timeout

    // Handle base64 encoded 32 byte key to encourage use of the full range of byte values
    if (options.encryptionMasterKeyBase64 !== undefined) {
      if (typeof options.encryptionMasterKeyBase64 !== "string") {
        throw new Error("encryptionMasterKeyBase64 must be a string")
      }
      if (!isBase64(options.encryptionMasterKeyBase64)) {
        throw new Error("encryptionMasterKeyBase64 must be valid base64")
      }

      const decodedKey = atob(options.encryptionMasterKeyBase64)

      if (decodedKey.length !== 32) {
        throw new Error(
          "encryptionMasterKeyBase64 must decode to 32 bytes, but the string " +
            options.encryptionMasterKeyBase64 +
            "' decodes to " +
            decodedKey.length +
            " bytes"
        )
      }

      this.encryptionMasterKey = naclUtil.decodeBase64(
        options.encryptionMasterKeyBase64
      )
    }
  }

  prefixPath(subPath: string) {
    throw "NotImplementedError: #prefixPath should be implemented by subclasses"
  }

  getBaseURL() {
    const port = this.port ? ":" + this.port : ""
    return this.scheme + "://" + this.host + port
  }
}
