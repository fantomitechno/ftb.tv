import { ChatUserstate, Client } from "tmi.js";

import {
  listCommand,
  getCommand,
} from "./prisma/commands.js";
import { readdirSync } from "fs";

const cooldownManager: { [command: string]: number } = {};

type Command = { execute: (client: Client, channel: string, channelId: string, state: ChatUserstate, args: string[], isMod: boolean) => Promise<void>, names: string[] }

const commands = new Map<string, Command>()
const commandAliases = new Map<string, string>();

const loadCommands = async () => {
  const files = readdirSync("./dist/commands")
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const command: Command = await import("./commands/" + file);
    loadCommand(command)
  }

  // hardcode help command
  loadCommand({
    names: ["help", "commands"],
    execute: async (client: Client, channel: string, channelId: string, state: ChatUserstate, args: string[], isMod: boolean) => {
      const commandList = await listCommand(channelId, isMod ? Array.from(commands.keys()) : [], isMod);
      client.raw(
        `@reply-parent-msg-id=${state.id
        } PRIVMSG ${channel} :Available commands are: ${commandList.join(", ")}`
      );
    }
  })
}

const loadCommand = async (command: Command) => {
  commands.set(command.names[0], command);
  for (const name of command.names) {
    commandAliases.set(name, command.names[0]);
  }
}

const executeCommand = async (
  commandRaw: string,
  args: string[],
  channel: string,
  state: ChatUserstate,
  client: Client,
  isMod: boolean
) => {
  const channelId = state["room-id"]!;
  const alias = commandAliases.get(commandRaw);
  if (alias) {
    const command = commands.get(alias)!
    command.execute(client, channel, channelId, state, args, isMod);
    return
  }

  const cooldown = cooldownManager[commandRaw];
  const command = await getCommand(channelId, commandRaw);
  if (!command) return;
  if (cooldown && cooldown + command.cooldown * 1000 > Date.now()) return;
  if (command.isMod && !isMod) return;
  let message;
  if (command.message) {
    message = formatMessage(command.message, channel, state, args)
  } else if (command.fetch) {
    const res = await fetch(formatMessage(command.fetch, channel, state, args, true));
    message = formatMessage(await res.text(), channel, state, args)
  }

  if (!message) return;

  if (command.reply)
    client.raw(
      `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${message}`
    );
  else client.say(channel, message);
};

const formatMessage = (message: string, channel: string, state: ChatUserstate, args: string[], urlEncode: boolean = false) => {
  message = message
    .replaceAll(`{user}`, urlEncode ? encodeURI(state["display-name"]!) : state["display-name"]!)
    .replaceAll(`{channel}`, urlEncode ? encodeURI(channel.replace("#", '')) : channel.replace("#", ''))
    .replaceAll(`{args}`, urlEncode ? encodeURI(args.join(" ")) : args.join(" "))

  return message
}

export { loadCommands, executeCommand }