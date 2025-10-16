// services/pushNotification.js
import { Expo } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo({
  //  accessToken: process.env.EXPO_ACCESS_TOKEN
  useFcmV1: true, // this can be set to true in order to use the FCM v1 API
});

/**
 * Validates if a token is a valid Expo push token
 * @param {string} pushToken - The token to validate
 * @returns {boolean} - Whether the token is valid
 */
export const isValidToken = (pushToken) => {
  return Expo.isExpoPushToken(pushToken);
};

/**
 * Send push notifications to one or multiple recipients
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification message body
 * @param {Object} data - Additional data to send with notification
 * @param {Object} options - Additional notification options
 * @returns {Promise<Array>} - Array of tickets
 */
export const sendNotification = async (
  tokens,
  title,
  body,
  data = {},
  options = {}
) => {
  // Convert single token to array if needed
  const pushTokens = Array.isArray(tokens) ? tokens : [tokens];

  // Create messages array
  const messages = [];

  // Process each token
  for (const pushToken of pushTokens) {
    // Skip invalid tokens
    if (!isValidToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Create notification message
    const message = {
      to: pushToken,
      title,
      body,
      data,
      sound: options.sound || "default",
      priority: options.priority || "default",
      channelId: options.channelId,
      badge: options.badge,
      ttl: options.ttl,
      expiration: options.expiration,
    };

    // Add rich content if provided
    if (options.richContent) {
      message.richContent = options.richContent;
    }

    messages.push(message);
  }

  // Skip if no valid messages
  if (messages.length === 0) {
    return [];
  }

  // Chunk the messages for sending
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  // Send each chunk
  try {
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return tickets;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};

/**
 * Check receipts for previously sent notifications
 * @param {string[]} receiptIds - Array of receipt IDs
 * @returns {Promise<Object>} - Object with receipt details
 */
export const checkReceipts = async (receiptIds) => {
  if (!receiptIds || receiptIds.length === 0) {
    return {};
  }

  const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  const receipts = {};

  try {
    for (const chunk of chunks) {
      const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
      Object.assign(receipts, receiptChunk);
    }

    return receipts;
  } catch (error) {
    console.error("Error checking notification receipts:", error);
    throw error;
  }
};

/**
 * Process receipts and extract errors
 * @param {Object} receipts - Receipts from checkReceipts()
 * @returns {Array} - Array of errors if any
 */
export const processReceiptErrors = (receipts) => {
  const errors = [];

  for (const receiptId in receipts) {
    const { status, message, details } = receipts[receiptId];

    if (status === "error") {
      errors.push({
        receiptId,
        message,
        errorCode: details?.error,
        details,
      });
    }
  }

  return errors;
};

export const servicePushNotification = async (
  tokens,
  title,
  body,
  data = {},
  options = {}
) => {
  // const tickets = await sendNotification(tokens, title, body, data, options);
  // const receipts = await checkReceipts(tickets.map((ticket) => ticket.id));
  // const errors = processReceiptErrors(receipts);
  return { tickets, receipts, errors };
};

export const sendBulkNotifications = async (
  recipients, // Array of recipient objects
  title,
  body,
  data = {},
  options = {}
) => {
  if (!Array.isArray(recipients)) {
    throw new Error("Recipients must be an array");
  }

  // Filter and validate tokens
  const validRecipients = recipients.filter(
    (recipient) => recipient.pushToken && isValidToken(recipient.pushToken)
  );

  console.log({
    fcc: validRecipients,
  });

  if (validRecipients.length === 0) {
    console.warn("No valid push tokens found in recipients");
    return {
      success: false,
      message: "No valid push tokens found",
      results: [],
    };
  }

  // Prepare messages with recipient-specific data
  const messages = validRecipients.map((recipient) => ({
    to: recipient.pushToken,
    title,
    body,
    data: {
      ...data,
      recipientId: recipient.id,
    },
    sound: options.sound || "default",
    ...(options.channelId && { channelId: options.channelId }),
    ...(options.badge && { badge: options.badge }),
    ...(options.richContent && { richContent: options.richContent }),
  }));

  // Chunk and send notifications
  const chunks = expo.chunkPushNotifications(messages);
  const results = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      results.push(
        ...tickets.map((ticket, index) => ({
          recipientId:
            validRecipients[chunk.length * chunks.indexOf(chunk) + index].id,
          pushToken:
            validRecipients[chunk.length * chunks.indexOf(chunk) + index]
              .pushToken,
          ticket,
          status: "sent",
        }))
      );
    } catch (error) {
      console.error("Error sending notification chunk:", error);
      chunk.forEach((_, index) => {
        results.push({
          recipientId:
            validRecipients[chunk.length * chunks.indexOf(chunk) + index].id,
          pushToken:
            validRecipients[chunk.length * chunks.indexOf(chunk) + index]
              .pushToken,
          error: error.message,
          status: "failed",
        });
      });
    }
  }

  // Process receipts if requested
  if (options.checkReceipts) {
    const receiptIds = results
      .filter((r) => r.ticket?.id)
      .map((r) => r.ticket.id);

    if (receiptIds.length > 0) {
      try {
        const receipts = await checkReceipts(receiptIds);
        const errors = processReceiptErrors(receipts);

        errors.forEach((error) => {
          const resultIndex = results.findIndex(
            (r) => r.ticket?.id === error.receiptId
          );
          if (resultIndex !== -1) {
            results[resultIndex].receiptError = error;
            results[resultIndex].status = "delivery_failed";
          }
        });
      } catch (error) {
        console.error("Error checking receipts:", error);
      }
    }
  }

  return {
    success: true,
    message: `Notifications processed (${
      results.filter((r) => r.status === "sent").length
    } sent, ${results.filter((r) => r.status !== "sent").length} failed)`,
    results,
  };
};
