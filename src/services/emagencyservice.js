import { Expo } from "expo-server-sdk";
import User from "../models/user.js";
import { sendNotificationsMutiple } from "./exponotificationService.js";

let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

async function getUserInfo(userId) {
  try {
    const user = await User.findById(userId);
    if (user) {
      return {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        tokens: user.tokens, // Include the tokens field
      };
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function getReporterinfoUserInfo(userId) {
  try {
    const user = await User.findById(userId);
    if (user) {
      return {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        tokens: user.tokens, // Include the tokens field
      };
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function getAdminsInfo(admins) {
  const adminsInfo = [];
  for (const admin of admins) {
    const userInfo = await getUserInfo(admin.user);
    if (userInfo) {
      adminsInfo.push(userInfo);
    }
  }
  return adminsInfo;
}

const EmergencyService = async (clan_info, emergencyReport) => {
  // Construct the message
  try {
    const adminsInfo = await getAdminsInfo(clan_info.admins);
    // console.log(adminsInfo);

    const tokensArray = adminsInfo.map((admin) => admin.tokens);
    // const Reporterinfo = emergencyReport.victimes;
    const Reporterinfo = await getReporterinfoUserInfo(emergencyReport.member);
    // let message_Data = {
    //     to: tokenNotification,
    //     sound: "default",
    //     body: "welcome to PausePoint",
    //     data: { withSome: "data" },
    //   };
    const notification_info = {
      title: "PausePoint",

      body: `${emergencyReport.type} ${emergencyReport.address}
      ${emergencyReport.additionalInfo}
      `,
      data: { withSome: emergencyReport },
    };

    const messages = await sendNotificationsMutiple(
      tokensArray,

      notification_info
    );
    return {
      notification_info,
      tokensArray,
      Reporterinfo,
      clan_info,
      emergencyReport,
      adminsInfo,
      messages,
    };
  } catch (error) {
    console.error(error);

    throw new Error(error);
  }
};

// async function sendNotificationsMutiple(pushTokensddddd, notificationsssss) {
//   const pushTokens = [
//     "ExponentPushToken[TZmRRTGdOUMyGqNGWHKfNb]",
//     "ExponentPushToken[fVM3QqOyMp0cHzqiq6OXys]" /* Add more tokens as needed */,
//   ];
//   const notification = {
//     body: "fire is coming This is a test notification",
//     data: { withSome: "data" },
//   };
//   let messages = [];

//   for (let pushToken of pushTokens) {
//     // Check that all push tokens appear to be valid Expo push tokens
//     if (!Expo.isExpoPushToken(pushToken)) {
//       console.error(`Push token ${pushToken} is not a valid Expo push token`);
//       continue;
//     }

//     // Construct a message
//     messages.push({
//       to: pushToken,
//       sound: "default",
//       ...notification,
//     });
//   }

//   // The Expo push notification service accepts batches of notifications
//   let chunks = expo.chunkPushNotifications(messages);
//   let tickets = [];

//   // Send the chunks to the Expo push notification service
//   for (let chunk of chunks) {
//     try {
//       let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       tickets.push(...ticketChunk);
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   return tickets;
// }

export { EmergencyService };
