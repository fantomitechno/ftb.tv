import { ChatUserstate, Client } from "tmi.js";
import { reloadSettings } from "../automod";

export const names = ["settings-reload", "settingsr"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!isMod) return;
  await reloadSettings(channelId);
  client.raw(
    `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Reloaded settings cache`
  );
};
