import { ChatUserstate, Client } from "tmi.js";
import { getWarns, addWarn } from "./prisma.js";
import { countUpperCase } from "./string.js";

const warn = async (client: Client, channel: string, state: ChatUserstate, reason: string, publicText: string, deleteMessage: boolean = true) => {
  const warns = await getWarns(state["user-id"]!);
  if (warns.length > 5) {
    client.timeout(
      channel,
      state.username!,
      60 * warns.length,
      `${reason}! | Warn #${warns.length + 1}`
    );
  } else {
    await client.say(channel, `${state["display-name"]}, ${publicText}`)
  }
  if (deleteMessage) await client.deletemessage(channel, state.id!)
  await addWarn(state.username!, state["user-id"]!, reason);
}

export const executeAutomod = async (message: string, state: ChatUserstate, channel: string, client: Client) => {
  if (
    message.length > 10 &&
    countUpperCase(message) / (message.match(/[A-z]/g) ?? []).length > 0.8
  ) {
    await warn(client, channel, state, "Too many uppercase", "don't use that many uppercase");
  }

  const regexp = /(\S+)([\t ]*)(?:\1\2?){7,}/g
  if (regexp.test(message) && message.length > 7) {
    await warn(client, channel, state, "Mass duplicated characters", "don't use that many duplicated characters");
  }
}