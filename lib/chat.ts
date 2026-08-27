export type ChatMemberRole = "client" | "developer";

/** Row shape as stored in the `chat_projects` table (snake_case). */
export type ChatProjectRow = {
  id: string;
  seeker_id: string;
  name: string;
  created_at: string;
};

/** Row shape as stored in the `chats` table (snake_case). */
export type ChatRow = {
  id: string;
  project_id: string;
  client_id: string;
  name: string;
  created_at: string;
  expires_at: string;
};

/** Row shape as stored in the `chat_members` table (snake_case). */
export type ChatMemberRow = {
  id: string;
  chat_id: string;
  user_id: string;
  role: ChatMemberRole;
  joined_at: string;
};

/** Row shape as stored in the `chat_messages` table (snake_case). */
export type ChatMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export const CHAT_MAX_MEMBERS = 6;

export function isChatExpired(chat: Pick<ChatRow, "expires_at">): boolean {
  return new Date(chat.expires_at).getTime() <= Date.now();
}
