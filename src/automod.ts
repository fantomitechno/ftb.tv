import { ChatUserstate, Client } from "tmi.js";

import { getWarns, addWarn, getSettings, getGlobalBanWords, getChannelBanWords } from "./prisma/index.js";
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

  const regexp = /(\S+)([\t ]*)(?:\1\2?){12,}/g;
  if (settings.antiDuplicate && regexp.test(message) && message.length > 7) {
    console.log(regexp.exec(message))
    await warn(
      client,
      channel,
      channelId,
      state,
      "Mass duplicated characters",
      settings.warnsBeforeBan
    );
  }

  executeBanWordsChecks(message, state, channel, channelId, client, settings.warnsBeforeBan);
};

const executeBanWordsChecks = async (
  message: string,
  state: ChatUserstate,
  channel: string,
  channelId: string,
  client: Client,
  maxWarn: number,) => {
  const globalBanWords = await getGlobalBanWords() || { blackList: [] };
  const channelBanWords = await getChannelBanWords(channelId) || { blackList: [] as string[], whiteList: [] as string[] };

  for (const GbanWord of globalBanWords.blackList.filter(w => !channelBanWords.whiteList.includes(w))) {
    if (message.includes(GbanWord)) {
      return await warn(
        client, channel, channelId, state, "Usage of banned word", maxWarn, true
      );
    }
  }
  for (const banWord of channelBanWords.blackList) {
    if (message.includes(banWord)) {
      return await warn(
        client, channel, channelId, state, "Usage of banned word", maxWarn, true
      );
    }
  }
}
