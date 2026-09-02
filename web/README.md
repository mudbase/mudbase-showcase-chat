# Mudbase Chat - web

A complete messenger built on [Mudbase](https://www.mudbase.dev), using Next.js 15 (App Router),
React 19, TanStack Query, and Tailwind CSS. It talks to Mudbase's ready-made chat API for
conversations and messages, Mudbase realtime for live delivery, typing, and presence, Mudbase
auth for accounts, and Mudbase storage for attachments.

## Features

- Sign up, sign in, sessions, and email verification
- Conversation list with unread counts and last-message previews
- 1:1 direct messages, group chats, and channels
- Message composer with replies, editing, and deleting
- Emoji reactions
- Read receipts (sent / read)
- Typing indicators
- Presence within an open conversation
- Media and file attachments (native upload with a storage key, or share a link)
- End-to-end encrypted messages (browser-side, using the Web Crypto API)
- Real-time delivery over the Mudbase socket
- Polished, responsive UI with empty, loading, and error states, and light / dark theming

## How chat is authorized

The chat write paths (create a conversation, send a message, react, mark read) are authorized
against a project key scoped to the `messaging` capability, sent alongside each signed-in user's
own session token. The request carries both: the user's token says who is acting, and the key
says the action is permitted. The key never replaces the user identity.

Reading conversations and messages and establishing a session work without the key. Leave the key
unset to run the app in read-only mode, where it will still sign in and load conversations and
clearly say that sending is disabled rather than failing silently.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Point the app at a Mudbase project. Copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_MUDBASE_PROJECT_ID` - your Mudbase project id.
   - `NEXT_PUBLIC_MUDBASE_APP_ROLE` - the role new sign-ups are created under (`user` by
     default; some projects use a custom app role such as `customer`).
   - `NEXT_PUBLIC_MUDBASE_MESSAGING_KEY` - a project key scoped to `messaging`, required for the
     write paths. Issue it from your project settings.
   - `NEXT_PUBLIC_MUDBASE_STORAGE_KEY` and `NEXT_PUBLIC_MUDBASE_STORAGE_BUCKET` - optional, for
     native attachment upload. Without them, attachments can still be shared by link.

3. Run it:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

## Provisioning a project

Create a project from the Mudbase console at [cloud.mudbase.dev](https://cloud.mudbase.dev), then:

- Confirm the project exposes a sign-up role at `POST /api/auth/local/signup/{role}` and set
  `NEXT_PUBLIC_MUDBASE_APP_ROLE` to it.
- Issue a project key with the `messaging` capability and set `NEXT_PUBLIC_MUDBASE_MESSAGING_KEY`.
- Optionally create a storage bucket and a `storage`-scoped key for uploads.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build
- `npm run start` - run the production build
- `npm run lint` - lint

Built by the Mudbase Team.
