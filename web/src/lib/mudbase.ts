import { MUDBASE_APP_ROLE, MUDBASE_MESSAGING_KEY, MUDBASE_STORAGE_KEY } from "./config"
import type {
  Chat,
  ChatMessage,
  ChatType,
  CreateChatInput,
  MessageReaction,
  ParticipantKey,
  SendMessageInput,
} from "@/types/chat"

// ─── Shared types ──────────────────────────────────────────────────────────

export interface MudbaseConfig {
  baseUrl?: string
  projectId: string
}

export interface RegisterParams {
  email: string
  password: string
  firstName: string
  lastName: string
  /** Required by Mudbase's registration validator - a direct call without it is rejected. */
  agreedToTerms: boolean
}

export interface LoginParams {
  email: string
  password: string
}

export interface UserObject {
  id: string
  email: string
  firstName: string
  lastName: string
  role?: string
  customRole?: string | null
  emailVerified: boolean
  isAnonymous?: boolean
}

export interface AuthResponse {
  message: string
  token?: string
  refreshToken?: string
  expiresIn?: number
  user: UserObject
  /**
   * True when the project requires email verification before login. Callers must not treat
   * a successful register() as a signed-in session when this is set.
   */
  requireVerification?: boolean
}

export interface SessionResponse {
  user: UserObject
  token: string
}

export interface FileObject {
  id: string
  originalName: string
  fileName: string
  size: number
  mimetype: string
  url: string
  isPublic: boolean
  uploadedAt: string
}

export class MudbaseError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "MudbaseError"
  }
}

/** Narrows MudbaseError.details to read a server-provided error `code` (e.g. EMAIL_VERIFICATION_REQUIRED). */
export function errorCode(err: unknown): string | undefined {
  if (!(err instanceof MudbaseError)) return undefined
  const details = err.details as { code?: string } | undefined
  return details?.code
}

const TOKEN_KEY = "mudbase_chat_token"
const REFRESH_KEY = "mudbase_chat_refresh_token"

interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  pages: number
}

export class MudbaseClient {
  private baseUrl: string
  private projectId: string
  private token: string | null = null
  private refreshToken: string | null = null
  private refreshInFlight: Promise<string> | null = null

  constructor(config: MudbaseConfig) {
    this.baseUrl = config.baseUrl ?? "https://cloud.mudbase.dev"
    this.projectId = config.projectId
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_KEY)
    }
  }

  get id(): string {
    return this.projectId
  }

  private setToken(token: string, refreshToken?: string): void {
    this.token = token
    if (refreshToken) this.refreshToken = refreshToken
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token)
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    }
  }

  clearToken(): void {
    this.token = null
    this.refreshToken = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshInFlight) return this.refreshInFlight
    this.refreshInFlight = (async () => {
      if (!this.refreshToken) throw new MudbaseError("No refresh token available", 401)
      const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })
      if (!res.ok) {
        this.clearToken()
        throw new MudbaseError("Session expired - please sign in again", 401)
      }
      const body = (await res.json()) as { token: string; refreshToken: string }
      this.setToken(body.token, body.refreshToken)
      return body.token
    })()
    try {
      return await this.refreshInFlight
    } finally {
      this.refreshInFlight = null
    }
  }

  /**
   * Core request helper.
   *
   * `apiKey` carries a project key scoped to a capability (messaging / storage). The chat
   * write endpoints authorize against that key while still reading the acting user's identity
   * from the bearer token - the request sends BOTH, so the key never impersonates a user.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: {
      auth?: boolean
      formData?: FormData
      apiKey?: string
      retriedAfterRefresh?: boolean
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {}
    if (!options.formData) headers["Content-Type"] = "application/json"
    if (options.auth !== false && this.token) headers["Authorization"] = `Bearer ${this.token}`
    if (options.apiKey) headers["X-API-Key"] = options.apiKey

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.formData ? options.formData : body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401 && options.auth !== false && this.refreshToken && !options.retriedAfterRefresh) {
      await this.refreshAccessToken()
      return this.request<T>(method, path, body, { ...options, retriedAfterRefresh: true })
    }

    if (!res.ok) {
      const error = (await res.json().catch(() => ({ error: res.statusText }))) as {
        error?: string
        message?: string
      }
      throw new MudbaseError(error.error ?? error.message ?? "Request failed", res.status, error)
    }

    const text = await res.text()
    return text ? (JSON.parse(text) as T) : ({} as T)
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async register(params: RegisterParams): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      "POST",
      `/api/auth/local/signup/${MUDBASE_APP_ROLE}`,
      { ...params, projectId: this.projectId },
      { auth: false },
    )
    if (res.token) this.setToken(res.token, res.refreshToken)
    return res
  }

  async login(params: LoginParams): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      "POST",
      "/api/auth/local/login",
      { ...params, projectId: this.projectId },
      { auth: false },
    )
    if (res.token) this.setToken(res.token, res.refreshToken)
    return res
  }

  async loginAnonymous(): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      "POST",
      "/api/auth/anonymous",
      { projectId: this.projectId },
      { auth: false },
    )
    if (res.token) this.setToken(res.token, res.refreshToken)
    return res
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>("POST", "/api/auth/logout", { projectId: this.projectId })
    } finally {
      this.clearToken()
    }
  }

  async getSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>("GET", `/api/auth/session?projectId=${this.projectId}`)
  }

  /** Public endpoint - completes the link sent in the verification email. */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("POST", "/api/users/verify-email", { token }, { auth: false })
  }

  // ─── Chat ────────────────────────────────────────────────────────────────

  private chatPath(suffix = ""): string {
    return `/api/chat/projects/${this.projectId}/chats${suffix}`
  }

  private msgKey(): { apiKey?: string } {
    return MUDBASE_MESSAGING_KEY ? { apiKey: MUDBASE_MESSAGING_KEY } : {}
  }

  async listChats(): Promise<Chat[]> {
    const res = await this.request<{ data: { chats: Chat[] } }>("GET", this.chatPath())
    return res.data?.chats ?? []
  }

  async getChat(chatId: string): Promise<Chat> {
    const res = await this.request<{ data: Chat }>("GET", this.chatPath(`/${chatId}`))
    return res.data
  }

  async createChat(input: CreateChatInput): Promise<Chat> {
    const res = await this.request<{ data: Chat }>("POST", this.chatPath(), input, this.msgKey())
    return res.data
  }

  async getMessages(chatId: string, before?: string): Promise<Paginated<ChatMessage>> {
    const qs = before ? `?before=${encodeURIComponent(before)}` : ""
    const res = await this.request<{ data: { messages: ChatMessage[]; pagination?: Partial<Paginated<ChatMessage>> } }>(
      "GET",
      this.chatPath(`/${chatId}/messages${qs}`),
    )
    const p = res.data?.pagination ?? {}
    return {
      items: res.data?.messages ?? [],
      page: p.page ?? 1,
      limit: p.limit ?? 50,
      total: p.total ?? (res.data?.messages?.length ?? 0),
      pages: p.pages ?? 1,
    }
  }

  async sendMessage(chatId: string, input: SendMessageInput): Promise<ChatMessage> {
    const res = await this.request<{ data: ChatMessage }>(
      "POST",
      this.chatPath(`/${chatId}/messages`),
      input,
      this.msgKey(),
    )
    return res.data
  }

  async editMessage(chatId: string, messageId: string, input: SendMessageInput): Promise<ChatMessage> {
    const res = await this.request<{ data: ChatMessage }>(
      "PATCH",
      this.chatPath(`/${chatId}/messages/${messageId}`),
      input,
      this.msgKey(),
    )
    return res.data
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.request<void>("DELETE", this.chatPath(`/${chatId}/messages/${messageId}`), undefined, this.msgKey())
  }

  async addReaction(chatId: string, messageId: string, emoji: string): Promise<MessageReaction[]> {
    const res = await this.request<{ data: MessageReaction[] }>(
      "POST",
      this.chatPath(`/${chatId}/messages/${messageId}/reactions`),
      { emoji },
      this.msgKey(),
    )
    return res.data ?? []
  }

  async removeReaction(chatId: string, messageId: string, emoji: string): Promise<MessageReaction[]> {
    const res = await this.request<{ data: MessageReaction[] }>(
      "DELETE",
      this.chatPath(`/${chatId}/messages/${messageId}/reactions`),
      { emoji },
      this.msgKey(),
    )
    return res.data ?? []
  }

  async markRead(chatId: string, messageIds: string[]): Promise<void> {
    await this.request<void>(
      "POST",
      this.chatPath(`/${chatId}/messages/read`),
      { messageIds },
      this.msgKey(),
    )
  }

  async addParticipant(chatId: string, userId: string): Promise<Chat> {
    const res = await this.request<{ data: Chat }>(
      "POST",
      this.chatPath(`/${chatId}/participants`),
      { userId },
      this.msgKey(),
    )
    return res.data
  }

  async removeParticipant(chatId: string, userId: string): Promise<Chat> {
    const res = await this.request<{ data: Chat }>(
      "DELETE",
      this.chatPath(`/${chatId}/participants`),
      { userId },
      this.msgKey(),
    )
    return res.data
  }

  // Presence is delivered over the realtime channel (chat:join -> user:online / user:offline
  // within a conversation room), not a REST endpoint - see useChatRealtime.

  // ─── End-to-end encryption ────────────────────────────────────────────────

  /** Register this device's public key so other participants can encrypt to us. */
  async putE2eeKey(publicKey: string): Promise<void> {
    await this.request<void>(
      "PUT",
      `/api/chat/projects/${this.projectId}/me/chat-e2ee-key`,
      { publicKey },
      this.msgKey(),
    )
  }

  async getParticipantKeys(chatId: string): Promise<ParticipantKey[]> {
    const res = await this.request<{ data: ParticipantKey[] }>(
      "GET",
      this.chatPath(`/${chatId}/e2ee/participant-keys`),
    )
    return res.data ?? []
  }

  // ─── Storage (media attachments) ──────────────────────────────────────────

  /** Uploads a file to a bucket, authorized with a storage-scoped project key. */
  async uploadFile(bucketId: string, file: File, isPublic = true): Promise<FileObject> {
    const formData = new FormData()
    formData.append("files", file)
    formData.append("isPublic", String(isPublic))
    const res = await this.request<{ success: boolean; files: FileObject[] }>(
      "POST",
      `/api/bucket/projects/${this.projectId}/buckets/${bucketId}/files`,
      undefined,
      { formData, apiKey: MUDBASE_STORAGE_KEY || undefined },
    )
    const uploaded = res.files?.[0]
    if (!uploaded) throw new MudbaseError("Upload returned no file record", 500)
    return uploaded
  }
}

let _client: MudbaseClient | null = null

export function getMudbaseClient(): MudbaseClient {
  if (!_client) throw new Error("Mudbase client not initialized. Call initMudbase() first.")
  return _client
}

export function initMudbase(config: MudbaseConfig): MudbaseClient {
  _client = new MudbaseClient(config)
  return _client
}

export type { Chat, ChatMessage, ChatType, CreateChatInput, SendMessageInput }
