import { ChatUserstate, Client } from "tmi.js";
import { getTitle, modifyTitle } from "./helix.js";
import { addCommand, delCommand, listCommand, getCommand } from "./prisma.js";

export const executeCommand = async (commandRaw: string, args: string[], channel: string, state: ChatUserstate, client: Client, isMod: boolean) => {
  switch (commandRaw) {
    case "add-com":
      if (isMod) {
        if (await addCommand(args[0], args.slice(1).join(" "))) {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} created`
          );
        } else {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} already exist`
          );
        }
      }
      break;
    case "del-com":
      if (await delCommand(args[0])) {
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} deleted`
        );
      } else {
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} doesn't exist`
        );
      }
      break;
    case "title":
      if (!args.length) {
        client.raw(
          `@reply-parent-msg-id=${state.id
          } PRIVMSG ${channel} :Title is "${await getTitle()}"`
        );
      } else {
        if (!isMod) return;
        if (await modifyTitle(args.join(" "))) {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Title updated`
          );
        } else {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :An error occured check logs @fantomitechno`
          );
        }
      }
      break;
    case "list-com":
    case "help":
    case "commands":
      const commands = await listCommand(isMod);
      client.raw(
        `@reply-parent-msg-id=${state.id
        } PRIVMSG ${channel} :Available commands are: ${commands.join(", ")}`
      );
      break;
    default:
      const command = await getCommand(commandRaw);
      if (!command) return;
      if (command.isMod && !isMod) return;
      if (command.message) {
        if (command.reply)
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${command.message}`
          );
        else client.say(channel, command.message);
      }
      break;
  }
}