import { ChatUserstate, Client } from "tmi.js";

import { getWarns, addWarn, getSettings } from "./prisma.js";
import { countUpperCase } from "./string.js";
import { deleteMessage, giveBan, giveWarn } from "./helix/chat.js";

const warn = async (
  client: Client,
  channel: string,
  channelId: string,
  state: ChatUserstate,
  reason: string,
  maxWarn: number,
  deleteMsg: boolean = true
) => {
  const warns = await getWarns(channelId, state["user-id"]!);
  if (warns.length > maxWarn) {
    const success = await giveBan(channelId, state["user-id"]!, `${reason}! | Warn #${warns.length + 1}`, 60 * warns.length)
    if (!success) client.say(channel, "An error occured while performing a timeout")

  } else {
    const success = await giveWarn(channelId, state["user-id"]!, `${reason}! | Warn #${warns.length + 1}`)
    if (!success) client.say(channel, "An error occured while performing a warning")
  }
  if (deleteMsg) await deleteMessage(channelId, state.id!);
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
  const upperCaseRatio = countUpperCase(message) / (message.match(/[A-z]/g) ?? []).length;
  if (
    settings.antiUpperCase &&
    message.length > 10 &&
    upperCaseRatio > 0.8
  ) {
    await warn(
      client,
      channel,
      channelId,
      state,
      "Too many uppercase",
      settings.warnsBeforeBan,
      upperCaseRatio > 0.9
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
      settings.warnsBeforeBan
    );
  }
};
