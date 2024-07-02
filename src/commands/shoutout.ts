import { ChatUserstate, Client } from "tmi.js";
import { giveShoutout, sendAnnouncement } from "../helix/chat.js"

export const names = ["shoutout", "so"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!isMod || !args[0]) return;
  const shoutout = args[0].replace("@", "");
  switch (await giveShoutout(channelId, shoutout)) {
    case 200:
      sendAnnouncement(
        channelId,
        "Join us following https://twitch.tv/" + shoutout
      );
      break;

    case 404:
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${shoutout} is not a valid streamer`
      );
      break;

    case 400:
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Not streaming, skill issue`
      );
      break;

    default:
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Tell fantomitechno there's a problem with my program`
      );
      break;
  }
}
