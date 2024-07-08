import { ChatUserstate, Client } from "tmi.js";
import { getChatSettings, modifyChatSettings } from "../helix/stream.js";

export const names = ["slowmode"];

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
  if (chatSettings.slow_mode) {
    await modifyChatSettings(channelId, { slow_mode: false });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed slowmode`
    );
  } else {
    let time = Number(args[0]);
    if (isNaN(time)) {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${args[0]} is not a valid number`
      );
      return;
    }
    await modifyChatSettings(channelId, {
      slow_mode: true,
      slow_mode_wait_time: time,
    });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Slowmode is now at ${time}s`
    );
  }
};
