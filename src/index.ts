import { ChatUserstate, Client } from "tmi.js";
import { config } from "dotenv";
import { addCommand, delCommand, getCommand, listCommand } from "./prisma.js";
config();

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
          addCommand(args[0], args.slice(1).join(" "))
            .catch(() => {
              client.raw(
                `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} already exist`
              );
            })
            .then(() => {
              client.raw(
                `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} created`
              );
            })
        }
        break;
      case "del-com":
        delCommand(args[0])
          .catch(() => {
            client.raw(
              `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} doesn't exist`
            );
          })
          .then(() => {
            client.raw(
              `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Command ${args[0]} deleted`
            );
          })
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