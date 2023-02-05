export interface Options {
  appId: string
  key: string
  secret: string
  useTLS?: boolean
  timeout?: number
  encryptionMasterKeyBase64?: string
  notificationHost?: string
  notificationEncrypted?: boolean
  cluster?: string
  host?: string
  port?: number
}

export interface TriggerParams {
  socket_id?: string
  info?: string
}

export interface BatchEvent {
  channel: string
  name: string
  data: any
  socket_id?: string
  info?: string
}

export type ReservedParams =
  | "auth_key"
  | "auth_timestamp"
  | "auth_version"
  | "auth_signature"
  | "body_md5"

// I can't help but feel that this is a bit of a hack, but it seems to be the
// best way of defining a type which allows any key except some known set.
// Relies on the observation that if a reserved key is provided, it must fit
// the RHS of the intersection, and have type `never`.
//
// https://stackoverflow.com/a/58594586
export type Params = { [key: string]: any } & {
  [K in ReservedParams]?: never
}

export interface RequestOptions {
  path: string
  params?: Params
  body?: any
}
export type GetOptions = RequestOptions
export interface PostOptions extends RequestOptions {
  body: any
}
export interface SignedQueryStringOptions {
  method: string
  path: string
  body?: string
  params?: Params
}

export interface ChannelAuthResponse {
  auth: string
  channel_data?: string
  shared_secret?: string
}

export interface UserAuthResponse {
  auth: string
  user_data: string
}

export interface PresenceChannelData {
  user_id: string
  user_info?: {
    [key: string]: any
  }
}

export interface UserChannelData {
  id: string
  [key: string]: any
}

export interface WebHookRequest {
  headers: Record<string, string>
  rawBody: string
}

interface Event {
  name: string
  channel: string
  event: string
  data: string
  socket_id: string
}

interface WebHookData {
  time_ms: number
  events: Array<Event>
}

export interface Token {
  key: string
  secret: string
}
