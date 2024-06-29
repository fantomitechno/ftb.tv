import { ChatUserstate, Client } from "tmi.js";
import {
  getChatSettings,
  getTitle,
  giveShoutout,
  modifyChatSettings,
  modifyTitle,
  sendAnnouncement,
} from "./helix.js";
import { addCommand, delCommand, listCommand, getCommand } from "./prisma.js";
import { init } from "./timer.js";

const cooldownManager: { [command: string]: number } = {};

export const executeCommand = async (
  commandRaw: string,
  args: string[],
  channel: string,
  state: ChatUserstate,
  client: Client,
  isMod: boolean
) => {
  const channelId = state["room-id"]!;
  switch (commandRaw) {
    case "add-com": {
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
      break;
    }
    case "del-com": {
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
      break;
    }
    case "title": {
      if (!args.length) {
        client.raw(
          `@reply-parent-msg-id=${state.id
          } PRIVMSG ${channel} :Title is "${await getTitle(channelId)}"`
        );
      } else {
        if (!isMod) return;
        if (await modifyTitle(channelId, args.join(" "))) {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Title updated`
          );
        } else {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Tell fantomitechno there's a problem with my program`
          );
        }
      }
      break;
    }
    case "so": {
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
      break;
    }
    case "slowmode": {
      if (!isMod) return;
      const chatSettings = await getChatSettings(channelId);
      if (chatSettings.slow_mode) {
        await modifyChatSettings(channelId, { slow_mode: false });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed slowmode`
        );
      } else {
        let time = Number(args[0]);
        if (isNaN(time)) {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${args[0]} is not a valid number`
          );
          return;
        }
        await modifyChatSettings(channelId, {
          slow_mode: true,
          slow_mode_wait_time: time,
        });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Slowmode is now at ${time}s`
        );
      }
      break;
    }
    case "submode": {
      if (!isMod) return;
      const chatSettings = await getChatSettings(channelId);
      if (chatSettings.subscriber_mode) {
        await modifyChatSettings(channelId, { subscriber_mode: false });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed submode`
        );
      } else {
        await modifyChatSettings(channelId, { subscriber_mode: true });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Submode is now active`
        );
      }
      break;
    }
    case "followmode": {
      if (!isMod) return;
      const chatSettings = await getChatSettings(channelId);
      if (chatSettings.follower_mode) {
        await modifyChatSettings(channelId, { follower_mode: false });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed followmode`
        );
      } else {
        let time = Number(args[0]);
        if (isNaN(time)) {
          client.raw(
            `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :${args[0]} is not a valid number`
          );
          return;
        }
        await modifyChatSettings(channelId, {
          follower_mode: true,
          follower_mode_duration: time,
        });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Followmode is now at ${time}m`
        );
      }
      break;
    }
    case "emotemode": {
      if (!isMod) return;
      const chatSettings = await getChatSettings(channelId);
      if (chatSettings.emote_mode) {
        await modifyChatSettings(channelId, { emote_mode: false });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Removed emotemode`
        );
      } else {
        await modifyChatSettings(channelId, { emote_mode: true });
        client.raw(
          `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Emotemode is now active`
        );
      }
      break;
    }
    case "timerr":
    case "timer-reload": {
      init(client, channelId, channel)
      client.raw(
        `@reply-parent-msg-id=${state.id} PRIVMSG ${channel} :Reloaded timers`
      );
    }
    case "list-com":
    case "help":
    case "commands": {
      const commands = await listCommand(channelId, isMod);
      client.raw(
        `@reply-parent-msg-id=${state.id
        } PRIVMSG ${channel} :Available commands are: ${commands.join(", ")}`
      );
      break;
    }
    default: {
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
      break;
    }
  }
};
