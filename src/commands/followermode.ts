import { ChatUserstate, Client } from "tmi.js";
import { getChatSettings, modifyChatSettings } from "../helix/stream.js";

export const names = ["followermod"];

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
  if (chatSettings.follower_mode) {
    await modifyChatSettings(channelId, { follower_mode: false });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed followmode`
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
      follower_mode: true,
      follower_mode_duration: time,
    });
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Followmode is now at ${time}m`
    );
  }
}
