import { ChatUserstate, Client } from "tmi.js";

import {
  getChatSettings,
  getTitle,
  giveShoutout,
  modifyChatSettings,
  modifyTitle,
  sendAnnouncement,
} from "./helix/index.js";
import {
  addCommand,
  delCommand,
  listCommand,
  getCommand,
} from "./prisma/commands.js";
import { init } from "./timer.js";
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
      const commandList = await listCommand(channelId, isMod ? Object.keys(commands) : [], isMod);
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
  if (command.message) {
    if (command.reply)
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${command.message}`
      );
    else client.say(channel, command.message);
  }

};

export { loadCommands, executeCommand }