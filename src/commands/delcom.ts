import { ChatUserstate, Client } from "tmi.js";
import { delCommand } from "../prisma/commands.js";

export const names = ["del-com"];

export const execute = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  args: string[],
  isMod: boolean
) => {
  if (isMod) {
    if (await delCommand(channelId, args[0])) {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} deleted`
      );
    } else {
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} doesn't exist`
      );
    }
  }
};
