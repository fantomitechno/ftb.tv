import { getSettings, getToken } from "./prisma.js";

interface ChatSettings {
  slow_mode?: boolean
  slow_mode_wait_time?: any
  follower_mode?: boolean
  follower_mode_duration?: number
  subscriber_mode?: boolean
  emote_mode?: boolean
}


const modifyTitle = async (channelId: string, newTitle: string) => {
  const settings = await getSettings(channelId);
  const title = settings?.title.length ? settings.title.replace("{}", newTitle) : newTitle;

  const token = await getToken(channelId);

  const req = await fetch(
    "https://api.twitch.tv/helix/channels?broadcaster_id=" + channelId,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
      }),
    }
  );
  if (req.status != 204) {
    console.log(await req.json());
    return false;
  }
  return true;
};

const getTitle = async (channelId: string) => {
  const token = await getToken(channelId);

  const req = await fetch(
    "https://api.twitch.tv/helix/channels?broadcaster_id=" + channelId,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": process.env.TWITCH_ID!,
      },
    }
  );

  return (await req.json()).data[0].title;
};

const modifyChatSettings = async (channelId: string, options: ChatSettings) => {
  const token = await getToken(channelId);

  const req = await fetch(
    "https://api.twitch.tv/helix/channels?broadcaster_id=" + channelId,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    }
  );

  return (await req.json()).data[0] as ChatSettings;
}

const getChatSettings = async (channelId: string) => {
  const token = await getToken(channelId);

  const req = await fetch(
    "https://api.twitch.tv/helix/chat/settings?broadcaster_id=" + channelId,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": process.env.TWITCH_ID!,
      },
    }
  );

  return (await req.json()).data[0] as ChatSettings;
}

export { modifyTitle, getTitle, modifyChatSettings, getChatSettings };
