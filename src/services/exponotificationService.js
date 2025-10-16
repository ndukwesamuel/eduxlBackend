import { Expo } from "expo-server-sdk";

let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

const send_PushNotification_To_User = async (message_Data) => {
  // Construct the message
  try {
    console.log({
      aa: message_Data,
    });
    // Construct the message
    const message = {
      // to: user.tokens,
      title: "PausePoint",
      to: message_Data.to,
      sound: message_Data.sound,
      body: message_Data.body,
      data: message_Data.data,
      icon: "https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQlj3rCfLHry58AtJ8ZyBEAFPtChMddDSUSjt7C7nV3Nhsni9RIx5b0-n7LxfgerrPS6b-P-u3BOM3abuY",
    };

    // Send the push notification
    let ticket = await expo.sendPushNotificationsAsync([message]);
    return ticket;
  } catch (error) {
    console.error(error);

    throw new Error(error);
  }
};

async function sendNotificationsMutiple(pushTokens, notification_info) {
  let messages = [];
  console.log({
    notification_info,
  });

  for (let pushToken of pushTokens) {
    // Check that all push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message
    messages.push({
      to: pushToken,
      sound: "default",
      ...notification_info,
    });
  }

  // The Expo push notification service accepts batches of notifications
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  // Send the chunks to the Expo push notification service
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  return tickets;
}

export { send_PushNotification_To_User, sendNotificationsMutiple };
