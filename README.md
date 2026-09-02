# Mudbase Showcase - Chat

A complete, polished messenger - the kind of app you would build for a team or a community -
built on [Mudbase](https://www.mudbase.dev). Direct messages, group chats, channels, media
attachments, reactions, replies, read receipts, typing indicators, presence, and end-to-end
encrypted messages, all delivered in real time.

Mudbase ships a ready-made chat API. This app is the UI on top of it: there is no custom chat
server to run, no message database to design, and no socket layer to operate. The app signs
users in, opens conversations, and reads and writes messages straight through Mudbase.

## Built on Mudbase

Every capability in this app comes from Mudbase:

| Feature | Mudbase capability |
|---|---|
| Sign up, sign in, sessions, email verification | Authentication |
| 1:1 direct messages, group chats, channels | Chat - conversations |
| Sending, editing, deleting messages | Chat - messages |
| Replies (quoted threads) | Chat - message replies |
| Emoji reactions | Chat - reactions |
| Read receipts | Chat - read state |
| Typing indicators | Realtime - typing events |
| Presence (who has a conversation open) | Realtime - presence events |
| Live message delivery | Realtime - message events |
| Media and file attachments | Storage |
| End-to-end encrypted messages | Chat - encrypted message payloads |

## What is honest here

Chat is a ready-made API you build a UI on - that is exactly what this app demonstrates. Where a
capability is not something a server can do, the app handles it correctly instead of faking it:

- End-to-end encryption is done in the browser. A per-device key pair is generated locally, the
  public key is published to the project, and each message is encrypted for its recipients before
  it leaves the device. Mudbase only ever stores opaque ciphertext, so it cannot read encrypted
  messages - and neither can a server-side search of them, which is why the app does not offer one.
- Presence for an end-user account is scoped to the conversation a person has open, which is the
  signal the platform exposes to a participant, rather than a global "everyone online" list.

## Structure

```
mudbase-showcase-chat/
  web/    Next.js 15 (App Router) web app - the reference messenger
```

## Setup

See [`web/README.md`](./web/README.md) for the full setup, including how to point the app at a
Mudbase project and which project keys the write paths need.

## Learn more

Visit [www.mudbase.dev](https://www.mudbase.dev).

Built by the Mudbase Team.
