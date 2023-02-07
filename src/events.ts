import * as util from "./util"
import nacl from "tweetnacl"
import naclUtil from "tweetnacl-util"
import Pusher from "./pusher"
import { BatchEvent, TriggerParams } from "./types"

async function encrypt(pusher: Pusher, channel: string, data: unknown) {
  if (pusher.config.encryptionMasterKey === undefined) {
    throw new Error("Set encryptionMasterKey before triggering events on encrypted channels")
  }

  const nonceBytes = nacl.randomBytes(24)

  const ciphertextBytes = nacl.secretbox(
    naclUtil.decodeUTF8(JSON.stringify(data)),
    nonceBytes,
    await pusher.channelSharedSecret(channel)
  )

  return JSON.stringify({
    nonce: naclUtil.encodeBase64(nonceBytes),
    ciphertext: naclUtil.encodeBase64(ciphertextBytes),
  })
}

export async function trigger(
  pusher: Pusher,
  channels: string[],
  eventName: string,
  data: unknown,
  params: TriggerParams = {}
) {
  if (channels.length === 1 && util.isEncryptedChannel(channels[0])) {
    const channel = channels[0]
    const event = {
      name: eventName,
      data: await encrypt(pusher, channel, data),
      channels: [channel],
      ...params,
    }
    return pusher.post({ path: "/events", body: event })
  } else {
    for (let i = 0; i < channels.length; i++) {
      if (util.isEncryptedChannel(channels[i])) {
        // For rationale, see limitations of end-to-end encryption in the README
        throw new Error("You cannot trigger to multiple channels when using encrypted channels")
      }
    }

    const event = {
      name: eventName,
      data: ensureJSON(data),
      channels: channels,
      ...params,
    }

    return pusher.post({ path: "/events", body: event })
  }
}

export async function triggerBatch(pusher: Pusher, batch: BatchEvent[]) {
  for (let i = 0; i < batch.length; i++) {
    batch[i].data = util.isEncryptedChannel(batch[i].channel)
      ? await encrypt(pusher, batch[i].channel, batch[i].data)
      : ensureJSON(batch[i].data)
  }
  return pusher.post({ path: "/batch_events", body: { batch: batch } })
}

function ensureJSON(data: string | unknown) {
  return typeof data === "string" ? data : JSON.stringify(data)
}
