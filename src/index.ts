import { config } from "dotenv";
config();

import { Client } from "tmi.js";
import { commandList, getCommand } from "./command.js";

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
  .then((_) => console.log("Connected!"))
  .catch(console.error);

const spamMap: {
  user: string;
  message: string;
  count: number;
  deleteCallback: NodeJS.Timeout;
}[] = [];

client.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith(process.env.PREFIX ?? "!")) {
    const [command, ...args] = message.slice(1).split(" ");
    if (["commands", "help"].includes(command)) {
      const commands = await commandList();
      client.raw(
        `@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} :the commands are: ${commands?.join(", ")}`
      );
    }
    const cmd = await getCommand(command);
    if (cmd) {
      const value = cmd.value.replace("%u", tags.username ?? "");
      if (cmd.respond) {
        client.raw(
          `@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} :${value}`
        );
      } else {
        client.say(channel, value);
      }
    }
  }

  if (
    client.isMod(channel, process.env.CLIENT ?? "") /*&&
    !(client.isMod(channel, tags.username ?? '') || tags.badges?.broadcaster || tags.badges?.vip)*/
  ) {
    const spam = spamMap.find(
      (s) => s.message == message && s.user == tags.username
    );
    if ((spam?.count ?? 0) > 3) {
      client
        .timeout(channel, tags.username ?? "", 60, "Spamming")
        .catch(console.error);
      client.deletemessage(channel, tags.id ?? "").catch(console.error);
      client.say(channel, `@${tags.username} stop spamming!`);
    } else if (spam) {
      spam.count++;
      spam.deleteCallback.refresh();
    } else {
      spamMap.push({
        user: tags.username ?? "",
        message,
        count: 1,
        deleteCallback: setTimeout(() => {
          spamMap.splice(
            spamMap.findIndex(
              (s) => s.message == message && s.user == tags.username
            ),
            1
          );
        }, 10000),
      });
    }

    if (tags["emotes-raw"]) {
      if (tags["emotes-raw"].split("-").length > 6) {
        client
          .timeout(channel, tags.username ?? "", 60, "Too many emotes")
          .catch(console.error);
        client.deletemessage(channel, tags.id ?? "").catch(console.error);
        client.say(channel, `@${tags.username} stop spamming emotes!`);
      }
    }
  }
});
