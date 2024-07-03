import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getToken = async (channelId: string) => {
  let token = await prisma.token.findUnique({ where: { channelId } });
  if (!token) throw new Error("No token");
  if (token.createdAt.getDate() + token.expiresIn * 1000 < Date.now()) {
    const req = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${token.refreshToken}&client_id=${process.env.TWITCH_ID}&client_secret=${process.env.TWITCH_SECRET}`,
    });
    const json = await req.json();
    const oldAccessToken = token.accessToken;
    token.accessToken = json.access_token;
    token.refreshToken = json.refresh_token;
    token.createdAt = new Date();
    await prisma.token.update({
      where: {
        accessToken: oldAccessToken,
        channelId,
      },
      data: token,
    });
  }
  return token;
};

export { prisma, getToken };

export * from "./banwords.js";
export * from "./commands.js";
export * from "./settings.js";
export * from "./timers.js";
export * from "./warns.js";
