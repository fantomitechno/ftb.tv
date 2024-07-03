import { prisma } from "./index.js";

const getGlobalBanWords = () => {
  return prisma.banWords.findUnique({ where: { channelId: "global" } });
};

export { getGlobalBanWords };
