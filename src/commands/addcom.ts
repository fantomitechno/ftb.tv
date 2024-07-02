import { ChatUserstate, Client } from "tmi.js";
import { addCommand } from "../prisma/commands.js"

export const names = ["add-com"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (isMod) {
    if (await addCommand(channelId, args[0], args.slice(1).join(" "))) {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} created`
      );
    } else {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} already exist`
      );
    }
  }
}
