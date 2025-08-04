import Message from "../models/Message.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";
/**
 * Send a new message
 * @route POST /api/v1/messages
 * @access Private (Guards & Employers)
 */
const sendMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation errors');
      error.status = 400;
      error.details = errors.array();
      throw error;
    }

    const { receiverId, content } = req.body;
    //const senderId = req.user.id;
    const senderId = "688a0add689e5c96dfaf09ca"; // For testing purposes, replace with actual user ID from req.user.id

    // Prevent sending message to self
    if (senderId === receiverId) {
      const error = new Error('Cannot send message to yourself');
      error.status = 400;
      throw error;
    }

    // ToDo: Validate receiver exists and has appropriate role
    // const receiver = await User.findById(receiverId);
    // if (!receiver) {
    //   const error = new Error('Receiver not found' + receiverId);
    //   error.status = 404;
    //   throw error;
    // }

    // Ensure communication is only between guards and employers
    // const senderRole = req.user.role;
    // const receiverRole = receiver.role;
    
    // const validCommunication = 
    //   (senderRole === 'guard' && receiverRole === 'employer') ||
    //   (senderRole === 'employer' && receiverRole === 'guard');

    // if (!validCommunication) {
    //   const error = new Error('Messages can only be sent between guards and employers');
    //   error.status = 403;
    //   throw error;
    // }

    // Create and save the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();

    // Populate sender and receiver details for response
    await message.populate([
      { path: 'sender', select: 'email' },
      { path: 'receiver', select: 'email' }
    ]);

    res.status(201).json({
      success: true,
      data: {
        messageId: message._id,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        timestamp: message.timestamp,
        isRead: message.isRead,
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    next(error);
  }
};

/**
 * Get inbox messages (received by logged-in user)
 * @route GET /api/v1/messages/inbox
 */
const getInboxMessages = async (req, res, next) => {
  try {
    //todo: use req.user.id once auth handler is updated
    const userId = "688a0add689e5c96dfaf09ca"; // For testing purposes, replace with actual user ID from req.user.id

    // Get messages received by the user
    const messages = await Message.find({ receiver: userId })
      .populate('sender', 'email')
      .populate('receiver', 'email')
      .sort({ timestamp: -1 })

    // Get unread count
    const unreadCount = await Message.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Inbox messages retrieved successfully',
      data: {
        messages,
        totalMessages: messages.length,
        unreadCount
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get sent messages (sent by logged-in user)
 * @route GET /api/v1/messages/sent
 * @access Private (Guards & Employers)
 */
const getSentMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get messages sent by the user
    const messages = await Message.find({ sender: userId })
      .populate('sender', 'email')
      .populate('receiver', 'email')
      .sort({ timestamp: -1 });



    res.status(200).json({
      success: true,
      message: 'Sent messages retrieved successfully',
      data: {
        messages,
        totalMessages: messages.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation between two users
 * @route GET /api/v1/messages/conversation/:userId
 * @access Private (Guards & Employers)
 */
const getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Get conversation messages
    const messages = await Message.getConversation(currentUserId, otherUserId);

    // Mark messages as read (messages received by current user from other user)
    await Message.markAsRead(currentUserId, otherUserId);

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: {
        conversation: {
          participant: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role
          },
          messages: messages.reverse() // Reverse to show oldest first
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 * @route PATCH /api/v1/messages/:messageId/read
 * @access Private (Guards & Employers)
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      const error = new Error('Message not found');
      error.status = 404;
      throw error;
    }

    // Only receiver can mark message as read
    if (message.receiver.toString() !== userId) {
      const error = new Error('Unauthorized to mark this message as read');
      error.status = 403;
      throw error;
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: {
        messageId: message._id,
        isRead: message.isRead
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics for the user
 * @route GET /api/v1/messages/stats
 * @access Private (Guards & Employers)
 */
const getMessageStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [unreadCount, sentCount, receivedCount] = await Promise.all([
      Message.countDocuments({ receiver: userId, isRead: false }),
      Message.countDocuments({ sender: userId }),
      Message.countDocuments({ receiver: userId })
    ]);

    res.status(200).json({
      success: true,
      message: 'Message statistics retrieved successfully',
      data: {
        unreadMessages: unreadCount,
        sentMessages: sentCount,
        receivedMessages: receivedCount,
        totalMessages: sentCount + receivedCount
      }
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
  getMessageStats
};