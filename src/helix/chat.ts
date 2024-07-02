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

export { sendAnnouncement, giveShoutout, deleteMessage }