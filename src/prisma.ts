import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addCommand = async (
  channelId: string,
  commandName: string,
  message: string
) => {
  if (
    await prisma.command.findFirst({
      where: {
        commandName,
        channelId,
      },
    })
  ) {
    return false;
  }
  await prisma.command.create({
    data: {
      commandName,
      message,
      channelId,
    },
  });
  return true;
};

const delCommand = async (channelId: string, commandName: string) => {
  if (
    !(await prisma.command.findFirst({
      where: {
        commandName,
      },
    }))
  ) {
    return false;
  }
  await prisma.command.delete({
    where: {
      channelCommand: {
        channelId,
        commandName,
      },
    },
  });
  return true;
};

const listCommand = async (channelId: string, isMod: boolean) => {
  const dbCommands = await prisma.command.findMany({
    where: {
      channelId,
      OR: [
        {
          isMod: isMod,
        },
        {
          isMod: false,
        },
      ],
    },
  });
  return isMod
    ? [
      ...dbCommands.map((c) => c.commandName),
      "add-com",
      "del-com",
      "list-com",
      "title",
      "so",
      "followmode",
      "emotemode",
      "submode",
      "slowmode",
      "timer-reload"
    ].sort()
    : dbCommands.map((c) => c.commandName);
};

const getCommand = async (channelId: string, commandName: string) => {
  return await prisma.command.findFirst({ where: { commandName, channelId } });
};

const getToken = async (channelId: string) => {
  let token = await prisma.token.findFirst();
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

const getSettings = async (channelId: string) => {
  return prisma.settings.findFirst({ where: { channelId } });
};

const getWarns = async (userId: string, channelId: string) => {
  return await prisma.warning.findMany({
    where: {
      userId,
      channelId,
      date: {
        gte: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      },
    },
  });
};

const addWarn = async (
  channelId: string,
  userName: string,
  userId: string,
  reason: string
) => {
  await prisma.user.upsert({
    where: {
      id: userId,
    },
    create: {
      id: userId,
      name: userName,
    },
    update: {
      name: userName,
    },
  });

  await prisma.warning.create({
    data: {
      channelId,
      userId: userId,
      reason,
    },
  });
};

const getTimers = async (channelId: string) => {
  return prisma.timer.findMany({ where: { channelId } });
};

const getTimer = async (channelId: string, timerId: number) => {
  return prisma.timer.findFirst({ where: { channelId, id: timerId } });
};

export {
  addCommand,
  listCommand,
  getCommand,
  delCommand,
  getToken,
  getSettings,
  getWarns,
  addWarn,
  getTimers,
  getTimer,
};
