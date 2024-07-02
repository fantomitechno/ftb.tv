import { ChatUserstate, Client } from "tmi.js";

import {
  getWarns,
  addWarn,
  getSettings,
  getGlobalBanWords,
} from "./prisma/index.js";
import { countUpperCase } from "./string.js";
import { deleteMessage, giveBan, giveWarn } from "./helix/chat.js";
import { BanWords, LinkFilters, Settings } from "@prisma/client";

export const executeAutomod = async (
  message: string,
  state: ChatUserstate,
  channel: string,
  client: Client,
  chatUserCache: string[]
) => {
  const channelId = state["room-id"]!;
  const settings = (await getSettings(channelId)) ?? {
    channelId: "",
    title: "",
    antiDuplicate: true,
    antiUpperCase: true,
    warnsBeforeBan: 5,
    banwords: {
      channelId: "",
      whiteList: [],
      blackList: []
    },
    linkFilters: {
      channelId: "",
      trustedLinks: ["clips.twitch.tv"],
      untrustedLinks: [],
      deleteAll: true
    }
  };

  executeBanWordsChecks(
    message,
    state,
    channel,
    channelId,
    client,
    settings
  );

  executeBadLinkChecks(
    message,
    state,
    channel,
    channelId,
    client,
    settings
  );

  const upperCaseRatio =
    countUpperCase(message) / (message.match(/[A-z]/g) ?? []).length;
  if (settings.antiUpperCase && message.length > 10 && upperCaseRatio > 0.8) {
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

  const duplicateRegexp = /(\S+)([\t ]*)(?:\1\2?){12,}/g;
  if (settings.antiDuplicate && duplicateRegexp.test(message) && message.length > 7) {
    const match = message.match(duplicateRegexp);

    let userMatched = false;
    for (const user of chatUserCache) {
      if (user.includes(match![0])) {
        userMatched = true;
        break;
      }
    }

    if (!userMatched) {
      await warn(
        client,
        channel,
        channelId,
        state,
        "Mass duplicated characters",
        settings.warnsBeforeBan
      );
    }
  }
};

const executeBanWordsChecks = async (
  message: string,
  state: ChatUserstate,
  channel: string,
  channelId: string,
  client: Client,
  settings: Settings & { banwords: BanWords, linkFilters: LinkFilters }
) => {
  const globalBanWords = (await getGlobalBanWords()) || { blackList: [] };

  for (const GbanWord of globalBanWords.blackList.filter(
    (w) => !settings.banwords.whiteList.includes(w)
  )) {
    if (message.includes(GbanWord)) {
      return await warn(
        client,
        channel,
        channelId,
        state,
        "Usage of banned word",
        settings.warnsBeforeBan,
        true
      );
    }
  }
  for (const banWord of settings.banwords.blackList) {
    if (message.includes(banWord)) {
      return await warn(
        client,
        channel,
        channelId,
        state,
        "Usage of banned word",
        settings.warnsBeforeBan,
        true
      );
    }
  }
};

const executeBadLinkChecks = async (
  message: string,
  state: ChatUserstate,
  channel: string,
  channelId: string,
  client: Client,
  settings: Settings & { banwords: BanWords, linkFilters: LinkFilters }) => {
  const linkRegexp = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm
  const domainRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm
  const matchs = message.match(linkRegexp);
  if (matchs?.length) {
    const domains = matchs.map(match => domainRegexp.exec(match)?.at(1))
    let trustedDomains = 0;
    for (const domain of domains) {
      if (!domain) {
        trustedDomains += 1
        continue
      }
      if (settings.linkFilters.trustedLinks.includes(domain)) {
        trustedDomains += 1
      }
      if (settings.linkFilters.untrustedLinks.includes(domain)) {
        await warn(
          client,
          channel,
          channelId,
          state,
          "Usage of untrusted link",
          settings.warnsBeforeBan,
          true
        );
        return;
      }
    }

    if (settings.linkFilters.deleteAll && trustedDomains < matchs.length && trustedDomains != -1) {
      await warn(
        client,
        channel,
        channelId,
        state,
        "Usage of untrusted link",
        settings.warnsBeforeBan,
        true
      );
    }
  }
}

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
    const success = await giveBan(
      channelId,
      state["user-id"]!,
      `${reason}! | Warn #${warns.length + 1}`,
      60 * warns.length
    );
    if (!success)
      client.say(channel, "An error occured while performing a timeout");
  } else {
    const success = await giveWarn(
      channelId,
      state["user-id"]!,
      `${reason}! | Warn #${warns.length + 1}`
    );
    if (!success)
      client.say(channel, "An error occured while performing a warning");
  }
  if (deleteMsg) await deleteMessage(channelId, state.id!);
  await addWarn(channelId, state.username!, state["user-id"]!, reason);
};