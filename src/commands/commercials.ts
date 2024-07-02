import { ChatUserstate, Client } from "tmi.js";
import { startCommercials } from "../helix/stream.js";

export const names = ["commercials", "ads"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (!isMod) return
  let time = Number(args[0]);
  if (isNaN(time)) {
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${args[0]} is not a valid number`
    );
    return;
  }
  const success = await startCommercials(channelId, time)
  if (success) {
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :A break is starting`
    );
  } else {
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :An error occured while launching an ad break`
    );

  }
}
