"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMudbase } from "@/lib/mudbase-provider"
import { encryptForRecipients } from "@/lib/e2ee"
import { chatsKey } from "./useChats"
import type { ChatMessage, MessageMedia, ParticipantKey, SendMessageInput } from "@/types/chat"

export function messagesKey(chatId: string) {
  return ["messages", chatId] as const
}

export function useMessages(chatId: string | null) {
  const { client, session } = useMudbase()
  return useQuery({
    queryKey: messagesKey(chatId ?? "none"),
    enabled: !!chatId && !!session,
    queryFn: async (): Promise<ChatMessage[]> => {
      const res = await client.getMessages(chatId as string)
      // The API returns newest-last already for the initial page; normalize to ascending by time.
      return [...res.items].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },
  })
}

export function useSendMessage(chatId: string) {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SendMessageInput): Promise<ChatMessage> => client.sendMessage(chatId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
      void queryClient.invalidateQueries({ queryKey: chatsKey })
    },
  })
}

/** Sends a plaintext message, encrypting it first when recipient keys are supplied (E2EE). */
export function useSendText(chatId: string) {
  const send = useSendMessage(chatId)
  return {
    ...send,
    sendText: async (text: string, replyTo?: string): Promise<void> => {
      await send.mutateAsync({ type: "text", content: text, replyTo })
    },
    sendEncrypted: async (
      text: string,
      recipientKeys: ParticipantKey[],
      replyTo?: string,
    ): Promise<boolean> => {
      const keyMap = Object.fromEntries(recipientKeys.map((k) => [k.userId, k.publicKey]))
      const ciphertext = await encryptForRecipients(text, keyMap)
      if (!ciphertext) return false
      await send.mutateAsync({ type: "text", e2ee: { ciphertext, alg: "RSA-OAEP-AES-GCM-v1" }, replyTo })
      return true
    },
    sendMedia: async (media: MessageMedia, type: SendMessageInput["type"], replyTo?: string): Promise<void> => {
      await send.mutateAsync({ type, content: media, replyTo })
    },
  }
}

export function useMessageActions(chatId: string) {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })

  const react = useMutation({
    mutationFn: ({ messageId, emoji, remove }: { messageId: string; emoji: string; remove?: boolean }) =>
      remove ? client.removeReaction(chatId, messageId, emoji) : client.addReaction(chatId, messageId, emoji),
    onSuccess: invalidate,
  })

  const edit = useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      client.editMessage(chatId, messageId, { type: "text", content: text }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (messageId: string) => client.deleteMessage(chatId, messageId),
    onSuccess: invalidate,
  })

  const markRead = useMutation({
    mutationFn: (messageIds: string[]) => client.markRead(chatId, messageIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatsKey })
    },
  })

  return { react, edit, remove, markRead }
}
