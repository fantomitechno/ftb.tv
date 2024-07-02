import { prisma } from "./index.js"

const getGlobalBanWords = () => {
  return prisma.banWords.findFirst({ where: { channelId: "global" } });
}

const getChannelBanWords = (channelId: string) => {
  return prisma.banWords.findFirst({ where: { channelId } })
}

export { getGlobalBanWords, getChannelBanWords }