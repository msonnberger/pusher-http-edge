import SparkMD5 from "spark-md5"

export function toOrderedArray(map: Record<string, any>) {
  return Object.keys(map)
    .map(function (key) {
      return [key, map[key]]
    })
    .sort(function (a, b) {
      if (a[0] < b[0]) {
        return -1
      }
      if (a[0] > b[0]) {
        return 1
      }
      return 0
    })
    .map(function (pair) {
      return pair[0] + "=" + pair[1]
    })
}

export function getMD5(body: string) {
  return SparkMD5.hash(body)
}

export function secureCompare(a: string, b: string) {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function isEncryptedChannel(channel: string) {
  return channel.startsWith("private-encrypted-")
}

export function bufToHex(arrayBuffer: ArrayBuffer) {
  return Array.prototype.map
    .call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, "0"))
    .join("")
}
