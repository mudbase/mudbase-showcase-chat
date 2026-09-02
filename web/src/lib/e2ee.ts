// End-to-end encryption for chat text messages, using the browser's WebCrypto API.
//
// Model: every device holds an RSA-OAEP identity keypair. The public key is published to the
// project so other participants can encrypt to it; the private key never leaves the device.
// A message is encrypted with a fresh random AES-GCM content key; that content key is then
// wrapped once per recipient with their RSA public key. The server only ever stores an opaque
// ciphertext blob (packed into the single `e2ee.ciphertext` field) - it has no key material and
// cannot read the message. This is why server-side search of encrypted messages is impossible
// and the UI says so instead of pretending otherwise.

const PRIV_KEY = "mudbase_chat_e2ee_priv"
const PUB_KEY = "mudbase_chat_e2ee_pub"
const ALG = "RSA-OAEP-AES-GCM-v1"

interface EncryptedBlob {
  alg: string
  iv: string // base64
  data: string // base64 ciphertext
  keys: Record<string, string> // userId -> base64 wrapped AES key
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}

function fromB64(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function hasCrypto(): boolean {
  return typeof window !== "undefined" && !!window.crypto?.subtle
}

async function importPublic(spkiB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    fromB64(spkiB64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  )
}

async function importPrivate(pkcs8B64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    fromB64(pkcs8B64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  )
}

/**
 * Returns this device's identity public key (base64 SPKI), generating and persisting a keypair
 * on first use. Returns null when WebCrypto is unavailable.
 */
export async function ensureIdentityKey(): Promise<string | null> {
  if (!hasCrypto()) return null
  const existingPub = localStorage.getItem(PUB_KEY)
  const existingPriv = localStorage.getItem(PRIV_KEY)
  if (existingPub && existingPriv) return existingPub

  const pair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"],
  )
  const spki = toB64(await crypto.subtle.exportKey("spki", pair.publicKey))
  const pkcs8 = toB64(await crypto.subtle.exportKey("pkcs8", pair.privateKey))
  localStorage.setItem(PUB_KEY, spki)
  localStorage.setItem(PRIV_KEY, pkcs8)
  return spki
}

/**
 * Encrypts plaintext for the given recipients (userId -> base64 public key). Returns the packed
 * ciphertext string to store in `e2ee.ciphertext`, or null if encryption is unavailable.
 */
export async function encryptForRecipients(
  plaintext: string,
  recipientKeys: Record<string, string>,
): Promise<string | null> {
  if (!hasCrypto()) return null
  const recipientIds = Object.keys(recipientKeys)
  if (recipientIds.length === 0) return null

  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(plaintext),
  )
  const rawAes = await crypto.subtle.exportKey("raw", aesKey)

  const keys: Record<string, string> = {}
  for (const uid of recipientIds) {
    try {
      const pub = await importPublic(recipientKeys[uid]!)
      const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pub, rawAes)
      keys[uid] = toB64(wrapped)
    } catch {
      // A participant with no published key simply cannot decrypt this message - skip them
      // rather than failing the whole send.
    }
  }
  if (Object.keys(keys).length === 0) return null

  const blob: EncryptedBlob = { alg: ALG, iv: toB64(iv.buffer), data: toB64(data), keys }
  return btoa(JSON.stringify(blob))
}

/**
 * Decrypts a packed ciphertext for the current device/user. Returns null when the message was
 * not encrypted to us or WebCrypto is unavailable.
 */
export async function decryptForSelf(packed: string, selfUserId: string): Promise<string | null> {
  if (!hasCrypto()) return null
  const priv = localStorage.getItem(PRIV_KEY)
  if (!priv) return null
  let blob: EncryptedBlob
  try {
    blob = JSON.parse(atob(packed)) as EncryptedBlob
  } catch {
    return null
  }
  const wrapped = blob.keys?.[selfUserId]
  if (!wrapped) return null
  try {
    const privKey = await importPrivate(priv)
    const rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privKey, fromB64(wrapped))
    const aesKey = await crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, false, ["decrypt"])
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(fromB64(blob.iv)) },
      aesKey,
      fromB64(blob.data),
    )
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}

export function e2eeAvailable(): boolean {
  return hasCrypto()
}
