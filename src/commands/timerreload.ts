import { ChatUserstate, Client } from "tmi.js";
import { init } from "../timer.js";

export const names = ["timer-reload", "timerr"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!isMod) return;
  await init(client, channelId, channel);
  client.raw(
    `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Reloaded timers`
  );
};
