import { ChatUserstate, Client } from "tmi.js";
import { getChatSettings, modifyChatSettings } from "../helix/stream.js";

export const names = ["emotemode"];

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
  if (chatSettings.emote_mode) {
    await modifyChatSettings(channelId, { emote_mode: false });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed emotemode`
    );
  } else {
    await modifyChatSettings(channelId, { emote_mode: true });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Emotemode is now active`
    );
  }
};
