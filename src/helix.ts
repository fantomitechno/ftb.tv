import { getSettings, getToken } from "./prisma.js";

interface ChatSettings {
  slow_mode?: boolean;
  slow_mode_wait_time?: any;
  follower_mode?: boolean;
  follower_mode_duration?: number;
  subscriber_mode?: boolean;
  emote_mode?: boolean;
}

const modifyTitle = async (channelId: string, newTitle: string) => {
  const settings = await getSettings(channelId);
  const title = settings?.title.length
    ? settings.title.replace("{}", newTitle)
    : newTitle;

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
        "Content-Type": "application/json",
      },
    }
  );

  return (await req.json()).data[0].title;
};

const checkIfStreaming = async (...channelIds: string[]) => {
  const req = await fetch(
    `https://api.twitch.tv/helix/streams?user_id=${channelIds.join("&user_id=")}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json"
      }
    }
  )


  const json: { data: any[] } = await req.json();

  return Boolean(json.data.length)
}

const modifyChatSettings = async (channelId: string, options: ChatSettings) => {
  const userId = await getUserId();

  const req = await fetch(
    `https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channelId}&moderator_id=${userId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    }
  );
  const json = await req.json();

  if (!req.ok) console.log(json);

  return json.data[0] as ChatSettings;
};

const getChatSettings = async (channelId: string) => {
  const req = await fetch(
    "https://api.twitch.tv/helix/chat/settings?broadcaster_id=" + channelId,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
    }
  );

  return (await req.json()).data[0] as ChatSettings;
};

const getUserId = async (login?: string) => {
  const req = await fetch(
    "https://api.twitch.tv/helix/users" + (login ? "?login=" + login : ""),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await req.json()).data[0];
  return data?.id;
};

const sendAnnouncement = async (
  channelId: string,
  message: string,
  color?: "blue" | "orange" | "primary" | "purple" | "green"
) => {
  const userId = await getUserId();
  await fetch(
    `https://api.twitch.tv/helix/chat/announcements?broadcaster_id=${channelId}&moderator_id=${userId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, color }),
    }
  );
};

const giveShoutout = async (channelId: string, shoutout: string) => {
  const shoutoutId = await getUserId(shoutout);
  if (!shoutoutId) return 404;
  const userId = await getUserId();
  const res = await fetch(
    `https://api.twitch.tv/helix/chat/shoutouts?from_broadcaster_id=${channelId}&moderator_id=${userId}&to_broadcaster_id=${shoutoutId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
      },
    }
  );
  if (res.status !== 204) {
    switch (res.status) {
      case 400:
        return 400;

      default:
        console.log(await res.json());
        return -1;
    }
  }
  return 200;
};

const deleteMessage = async (channelId: string, messageId: string) => {
  const modId = await getUserId();
  const res = await fetch(`
    https://api.twitch.tv/helix/moderation/chat?broadcaster_id=${channelId}&moderator_id=${modId}&message_id=${messageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
      },
    }
  )

  if (res.status != 200) {
    console.error(`User doesn't have mod power at ${channelId}`)
  }
}

export {
  modifyTitle,
  getTitle,
  modifyChatSettings,
  getChatSettings,
  giveShoutout,
  sendAnnouncement,
  getUserId,
  checkIfStreaming,
  deleteMessage
};
