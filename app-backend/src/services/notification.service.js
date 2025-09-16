import { getMessaging } from '../config/firebase.js';
import Guard from '../models/Guard.js';
import Notification from '../models/Notification.js';

const VALID_NOTIFICATION_TYPES = ['SHIFT_NEW', 'SHIFT_UPDATE', 'MESSAGE'];

/**
 * Remove invalid tokens from a guard's device tokens
 * @param {string} guardId - Guard ID
 * @param {string[]} invalidTokens - Array of invalid tokens to remove
 */
async function pruneInvalidTokens(guardId, invalidTokens) {
  try {
    await Guard.updateOne(
      { _id: guardId },
      { $pull: { deviceTokens: { $in: invalidTokens } } }
    );
    console.log(`Pruned ${invalidTokens.length} invalid tokens for guard ${guardId}`);
  } catch (error) {
    console.error('Error pruning invalid tokens:', error);
  }
}

/**
 * Send push notification to specified devices and save audit log
 * @param {Object} params Notification parameters
 * @param {Array<string>} [params.guardIds] - List of guard IDs to send notification to
 * @param {Array<string>} [params.tokens] - List of FCM device tokens
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {Object} [params.data] - Additional data payload
 * @param {string} [params.type] - Notification type (SHIFT_NEW, SHIFT_UPDATE, MESSAGE)
 * @returns {Promise<Object>} Response with success status and counts
 */
export const sendNotification = async ({
  guardIds = [],
  tokens = [],
  title,
  body,
  data = {},
  type = 'MESSAGE'
}) => {
  // Validate notification type
  if (!VALID_NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Invalid notification type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`);
  }
  try {
    // Collect device tokens
    let targetTokens = [...tokens];

    // If guard IDs are provided, fetch their device tokens
    if (guardIds.length > 0) {
      const guards = await Guard.find({ _id: { $in: guardIds } });
      guards.forEach(guard => {
        if (guard.deviceTokens && guard.deviceTokens.length > 0) {
          targetTokens.push(...guard.deviceTokens);
        }
      });
    }

    // Remove any duplicate tokens
    targetTokens = [...new Set(targetTokens)];

    if (targetTokens.length === 0) {
      return {
        success: false,
        message: 'No valid device tokens found'
      };
    }

    // Construct the message
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        type,
        timestamp: Date.now().toString()
      },
      tokens: targetTokens,
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    let notificationResult;

    if (process.env.USE_MOCK_NOTIFICATIONS === 'true') {
      console.log('Mock Notification:', { title, body, data, targetTokens });
      notificationResult = { 
        success: true,
        successCount: targetTokens.length,
        failureCount: 0
      };
    } else {
      // Send through Firebase FCM
      const response = await getMessaging().sendEachForMulticast(message);

      // Handle any failures
      if (response.failureCount > 0) {
        const failures = response.responses.map((resp, idx) => {
          if (!resp.success) {
            return {
              token: targetTokens[idx],
              error: resp.error.message
            };
          }
        }).filter(Boolean);

      }

      notificationResult = {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    }

    // Save audit log for each guard
    const auditPromises = guardIds.map(guardId =>
      Notification.create({
        guardId,
        title,
        body,
        data,
        type,
        status: notificationResult.success ? 'SENT' : 'FAILED'
      })
    );

    await Promise.all(auditPromises);

    return {
      ...notificationResult,
      totalTokens: targetTokens.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to send push notification'
    };
  }
}
