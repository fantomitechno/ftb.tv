import { ChatUserstate, Client } from "tmi.js";
import { getChatSettings, modifyChatSettings } from "../helix/stream.js";

export const names = ["submode"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!isMod) return;
  const chatSettings = await getChatSettings(channelId);
  if (chatSettings.subscriber_mode) {
    await modifyChatSettings(channelId, { subscriber_mode: false });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed submode`
    );
  } else {
    await modifyChatSettings(channelId, { subscriber_mode: true });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Submode is now active`
    );
  }
}
