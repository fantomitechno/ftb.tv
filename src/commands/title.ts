import { ChatUserstate, Client } from "tmi.js";
import { getTitle, modifyTitle } from "../helix/stream.js";

export const names = ["title"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!args.length) {
    client.raw(
      `@reply-parent-msg-id=${
        state.id
      } PRIVMSG ${channel} :Title is "${await getTitle(channelId)}"`
    );
  } else {
    if (!isMod) return;
    if (await modifyTitle(channelId, args.join(" "))) {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Title updated`
      );
    } else {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Tell fantomitechno there's a problem with my program`
      );
    }
  }
};
