import { ChatUserstate, Client } from "tmi.js";
import { config } from "dotenv";
config();

import { addCommand, delCommand, getCommand, listCommand } from "./prisma.js";
import { getTitle, modifyTitle } from "./helix.js";

const channels = process.env.CHANNELS?.split(",") ?? [];

const client = new Client({
  identity: {
    username: process.env.CLIENT,
    password: process.env.CLIENT_TOKEN,
  },
  channels,
});

client
  .connect()
  .then(() => console.log(`Connected to ${channels.length} channels!`))
  .catch(console.error);

const isMod = (channel: string, state: ChatUserstate) => client.isMod(channel, state.username!) || Boolean(state.badges?.broadcaster)

client.on("message", async (channel, state, message, self) => {
  if (self) return;

  if (message.startsWith(process.env.PREFIX ?? "!")) {
    const [commandRaw, ...args] = message.slice(1).split(" ");

    switch (commandRaw) {
      case "add-com":
        if (isMod(channel, state)) {
          if (await addCommand(args[0], args.slice(1).join(" "))) {
            client.raw(
              `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} created`
            );
          }
          else {
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
        }
        else {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} doesn't exist`
          );
        }
        break;
      case "title":
        if (!args.length) {
          client.raw(`@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Title is "${await getTitle()}"`)
        }
        else {
          if (!isMod(channel, state)) return;
          if (await modifyTitle(args.join(" "))) {
            client.raw(`@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Title updated`)
          }
          else {
            client.raw(`@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :An error occured check logs @fantomitechno`)
          }
        }
        break;
      case "list-com":
      case "help":
      case "commands":
        const commands = await listCommand(isMod(channel, state));
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Available commands are: ${commands.join(", ")}`
        );
        break;
      default:
        const command = await getCommand(commandRaw);
        if (!command) return;
        if (command.isMod && !isMod(channel, state)) return;
        if (command.message) {
          if (command.reply) client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${command.message}`
          );
          else client.say(channel, command.message);
        }
        break;
    }
  }
})