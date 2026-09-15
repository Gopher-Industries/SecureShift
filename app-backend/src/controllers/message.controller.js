import mongoose from "mongoose";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { validationResult } from "express-validator";
import { ACTIONS } from "../middleware/logger.js";

/**
 * Send a new message
 * @route POST /api/v1/messages
 * @access Private (Guards & Employers)
 */
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation errors");
      error.status = 400;
      error.details = errors.array();
      throw error;
    }

    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Reject malformed receiver IDs before querying MongoDB.
    if (!mongoose.isValidObjectId(receiverId)) {
      const error = new Error("Invalid receiver ID");
      error.status = 400;
      throw error;
    }

    // Validate message content.
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (
      typeof content !== "string" ||
      trimmedContent.length < 1 ||
      trimmedContent.length > 1000
    ) {
      const error = new Error(
        "Message content must be a string between 1 and 1000 characters",
      );
      error.status = 400;
      throw error;
    }

    // Prevent sending message to self.
    if (senderId === receiverId) {
      const error = new Error("Cannot send message to yourself");
      error.status = 400;
      throw error;
    }

    // Validate receiver exists.
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      const error = new Error("Receiver not found " + receiverId);
      error.status = 404;
      throw error;
    }

    // Reject messages to soft-deleted users.
    // Legacy users without isDeleted are still treated as active.
    if (receiver.isDeleted === true) {
      const error = new Error("Receiver not found");
      error.status = 404;
      throw error;
    }

    // Allow guard-to-guard and guard/employer messaging, but keep
    // employer-to-employer and admin messaging blocked.
    const senderRole = req.user.role;
    const receiverRole = receiver.role;

    const validCommunication =
      (senderRole === "guard" && receiverRole === "guard") ||
      (senderRole === "guard" && receiverRole === "employer") ||
      (senderRole === "employer" && receiverRole === "guard");

    if (!validCommunication) {
      const error = new Error(
        "Messages can only be sent between guards, or between guards and employers",
      );
      error.status = 403;
      throw error;
    }

    // Create and save the message.
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: trimmedContent,
    });

    await message.save();

    // Populate sender and receiver details for response.
    await message.populate([
      { path: "sender", select: "email name role" },
      { path: "receiver", select: "email name role" },
    ]);

    await req.audit.log(req.user.id, ACTIONS.MESSAGE_SENT, {
      messageId: message._id,
      receiverId,
      contentSnippet: message.content.slice(0, 50),
    });

    res.status(201).json({
      success: true,
      data: {
        messageId: message._id,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        timestamp: message.timestamp,
        isRead: message.isRead,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
};

/**
 * Get inbox messages
 * @route GET /api/v1/messages/inbox
 */
const getInboxMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({ receiver: userId })
      .populate("sender", "email name role")
      .populate("receiver", "email name role")
      .sort({ timestamp: -1 });

    const unreadCount = await Message.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: "Inbox messages retrieved successfully",
      data: {
        messages,
        totalMessages: messages.length,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sent messages
 * @route GET /api/v1/messages/sent
 */
const getSentMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({ sender: userId })
      .populate("sender", "email name role")
      .populate("receiver", "email name role")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      message: "Sent messages retrieved successfully",
      data: {
        messages,
        totalMessages: messages.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation between two users
 * @route GET /api/v1/messages/conversation/:userId
 */
const getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Reject malformed user IDs before querying MongoDB.
    if (!mongoose.isValidObjectId(otherUserId)) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      throw error;
    }

    // Validate other user exists.
    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const messages = await Message.getConversation(currentUserId, otherUserId);

    await Message.markAsRead(currentUserId, otherUserId);

    res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: {
        conversation: {
          participant: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
          },
          messages: messages.reverse(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 * @route PATCH /api/v1/messages/:messageId/read
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    // Reject malformed message IDs before querying MongoDB.
    if (!mongoose.isValidObjectId(messageId)) {
      const error = new Error("Invalid message ID");
      error.status = 400;
      throw error;
    }

    const message = await Message.findById(messageId);

    if (!message) {
      const error = new Error("Message not found");
      error.status = 404;
      throw error;
    }

    // Only receiver can mark message as read.
    if (message.receiver.toString() !== userId) {
      const error = new Error("Unauthorized to mark this message as read");
      error.status = 403;
      throw error;
    }

    message.isRead = true;
    await message.save();

    await req.audit.log(req.user.id, ACTIONS.MESSAGE_READ, {
      messageId: message._id,
      senderId: message.sender,
    });

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: {
        messageId: message._id,
        isRead: message.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics for the user
 * @route GET /api/v1/messages/stats
 */
const getMessageStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [unreadCount, sentCount, receivedCount] = await Promise.all([
      Message.countDocuments({ receiver: userId, isRead: false }),
      Message.countDocuments({ sender: userId }),
      Message.countDocuments({ receiver: userId }),
    ]);

    res.status(200).json({
      success: true,
      message: "Message statistics retrieved successfully",
      data: {
        unreadMessages: unreadCount,
        sentMessages: sentCount,
        receivedMessages: receivedCount,
        totalMessages: sentCount + receivedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  getMessageStats,
};
