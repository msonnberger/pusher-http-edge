import Pusher from "./pusher"
import Token from "./token"
import { UserChannelData, ChannelAuthResponse } from "./types"
import * as util from "./util"

export function getSocketSignatureForUser(
  token: Token,
  socketId: string,
  userData: UserChannelData
) {
  const serializedUserData = JSON.stringify(userData)
  const signature = token.sign(`${socketId}::user::${serializedUserData}`)
  return {
    auth: `${token.key}:${signature}`,
    user_data: serializedUserData,
  }
}

export function getSocketSignature(
  pusher: Pusher,
  token: Token,
  channel: string,
  socketID: string,
  data: any
) {
  const result: ChannelAuthResponse = { auth: "" }

  const signatureData = [socketID, channel]
  if (data) {
    const serializedData = JSON.stringify(data)
    signatureData.push(serializedData)
    result.channel_data = serializedData
  }

  result.auth = token.key + ":" + token.sign(signatureData.join(":"))

  if (util.isEncryptedChannel(channel)) {
    if (pusher.config.encryptionMasterKey === undefined) {
      throw new Error(
        "Cannot generate shared_secret because encryptionMasterKey is not set"
      )
    }
    result.shared_secret = Buffer.from(
      pusher.channelSharedSecret(channel)
    ).toString("base64")
  }

  return result
}
