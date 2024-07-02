import { getUserId } from "./user.js";

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
        "Content-Type": "application/json",
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
        "Content-Type": "application/json",
      },
    }
  )

  if (res.status != 200) {
    console.error(`User doesn't have mod power at ${channelId}`)
  }
}

const giveWarn = async (channelId: string, userId: string, reason: string) => {
  const modId = await getUserId();

  const res = await fetch(`https://api.twitch.tv/helix/moderation/warnings?broadcaster_id=${channelId}&moderator_id=${modId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
      "Client-Id": process.env.TWITCH_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        user_id: userId,
        reason
      }
    })
  })

  return res.status == 200;
}

const giveBan = async (channelId: string, userId: string, reason: string, duration: number) => {
  const modId = await getUserId();

  const res = await fetch(`https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${channelId}&moderator_id=${modId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
      "Client-Id": process.env.TWITCH_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        user_id: userId,
        reason,
        duration
      }
    })
  })

  return res.status == 200;
}

export { sendAnnouncement, giveShoutout, deleteMessage, giveWarn, giveBan }