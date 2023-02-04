import * as util from "./util.js"

export function getSocketSignatureForUser(token, socketId, userData) {
  const serializedUserData = JSON.stringify(userData)
  const signature = token.sign(`${socketId}::user::${serializedUserData}`)
  return {
    auth: `${token.key}:${signature}`,
    user_data: serializedUserData,
  }
}

export function getSocketSignature(pusher, token, channel, socketID, data) {
  const result = {}

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
