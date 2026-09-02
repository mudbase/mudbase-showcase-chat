"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMudbase } from "@/lib/mudbase-provider"
import type { Chat, CreateChatInput } from "@/types/chat"

export const chatsKey = ["chats"] as const

export function useChats() {
  const { client, session } = useMudbase()
  return useQuery({
    queryKey: chatsKey,
    enabled: !!session,
    queryFn: () => client.listChats(),
    refetchOnWindowFocus: true,
  })
}

export function useChat(chatId: string | null) {
  const { client, session } = useMudbase()
  return useQuery({
    queryKey: ["chat", chatId],
    enabled: !!chatId && !!session,
    queryFn: () => client.getChat(chatId as string),
  })
}

export function useCreateChat() {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChatInput): Promise<Chat> => client.createChat(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatsKey })
    },
  })
}
