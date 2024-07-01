import { ChatUserstate, Client } from "tmi.js";

import { getWarns, addWarn, getSettings } from "./prisma.js";
import { countUpperCase } from "./string.js";
import { deleteMessage } from "./helix.js";

const warn = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  reason: string,
  publicText: string,
  maxWarn: number,
  deleteMsg: boolean = true
) => {
  const warns = await getWarns(channelId, state["user-id"]!);
  if (warns.length > maxWarn) {
    client.timeout(
      channel,
      state.username!,
      60 * warns.length,
      `${reason}! | Warn #${warns.length + 1}`
    );
  } else {
    await client.say(channel, `${state["display-name"]}, ${publicText}`);
  }
  if (deleteMsg) await deleteMessage(channel, state.id!);
  await addWarn(channelId, state.username!, state["user-id"]!, reason);
};

export const executeAutomod = async (
  message: string,
  state: ChatUserstate,
  channel: string,
  client: Client
) => {
  const channelId = state["room-id"]!;
  const settings = (await getSettings(channelId)) ?? {
    antiDuplicate: true,
    antiUpperCase: true,
    warnsBeforeBan: 5
  };
  if (
    settings.antiUpperCase &&
    message.length > 10 &&
    countUpperCase(message) / (message.match(/[A-z]/g) ?? []).length > 0.8
  ) {
    await warn(
      client,
      channel,
      channelId,
      state,
      "Too many uppercase",
      "don't use that many uppercase",
      settings.warnsBeforeBan
    );
  }

  const regexp = /(\S+)([\t ]*)(?:\1\2?){7,}/g;
  if (settings.antiDuplicate && regexp.test(message) && message.length > 7) {
    await warn(
      client,
      channel,
      channelId,
      state,
      "Mass duplicated characters",
      "don't use that many duplicated characters",
      settings.warnsBeforeBan
    );
  }
};
