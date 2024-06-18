import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addCommand = async (commandName: string, message: string) => {
  if (
    await prisma.command.findFirst({
      where: {
        commandName,
      },
    })
  ) {
    return false;
  }
  await prisma.command.create({
    data: {
      commandName,
      message,
    },
  });
  return true;
};

const delCommand = async (commandName: string) => {
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
      commandName,
    },
  });
  return true;
};

const listCommand = async (isMod: boolean) => {
  const dbCommands = await prisma.command.findMany();
  return isMod
    ? [
      ...dbCommands.map((c) => c.commandName),
      "add-com",
      "del-com",
      "list-com",
    ]
    : dbCommands.map((c) => c.commandName);
};

const getCommand = async (commandName: string) => {
  return await prisma.command.findFirst({ where: { commandName } });
};

const getToken = async () => {
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
      },
      data: token,
    });
  }
  return token.accessToken;
};

const getTemplate = async () => {
  return prisma.template.findFirst();
};

const getWarns = async (userId: string) => {
  return await prisma.warning.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      },
    },
  });
};

const addWarn = async (userName: string, userId: string, reason: string) => {
  await prisma.user.upsert({
    where: {
      id: userId
    },
    create: {
      id: userId,
      name: userName
    },
    update: {
      name: userName
    }
  });

  await prisma.warning.create({
    data: {
      userId: userId,
      reason
    }
  })
};

export {
  addCommand,
  listCommand,
  getCommand,
  delCommand,
  getToken,
  getTemplate,
  getWarns,
  addWarn,
};
