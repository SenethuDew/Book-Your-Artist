const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { messageSchema } = require("../validators");
const mongoose = require("mongoose");

class MessageController {
  /**
   * Send a message
   * POST /api/messages
   */
  async sendMessage(req, res) {
    try {
      const senderId = req.user?.id;
      if (!senderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Validate input
      const validation = messageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid message data",
          errors: validation.error.flatten(),
        });
      }

      const { conversationId, recipientId, content } = validation.data;

      // If no conversation ID, find or create one
      let convoId = conversationId;
      if (!convoId) {
        // Find or create conversation
        const participants = [
          new mongoose.Types.ObjectId(senderId),
          new mongoose.Types.ObjectId(recipientId),
        ].sort((a, b) => a.toString().localeCompare(b.toString()));

        let conversation = await Conversation.findOne({
          participants: { $all: participants },
        });

        if (!conversation) {
          conversation = new Conversation({
            participants,
            unreadCount: { [recipientId]: 1 },
          });
          await conversation.save();
        }

        convoId = conversation._id;
      }

      // Create message
      const message = new Message({
        conversationId: convoId,
        senderId,
        recipientId,
        content,
        read: false,
      });

      await message.save();

      // Update conversation
      await Conversation.findByIdAndUpdate(convoId, {
        lastMessage: content,
        lastMessageAt: new Date(),
        [`unreadCount.${recipientId}`]: (await Message.countDocuments({
          conversationId: convoId,
          recipientId,
          read: false,
        })),
      });

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get conversation messages
   * GET /api/messages/conversation/:conversationId
   */
  async getConversationMessages(req, res) {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Verify user is part of conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.participants.some((p) => p.toString() === userId)) {
        // Return 404 for non-existent or unauthorized access
        if (!conversation) {
          return res.status(404).json({
            success: false,
            message: "Conversation not found",
          });
        }
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this conversation",
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const messages = await Message.find({ conversationId })
        .populate("senderId", "name profileImage")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Message.countDocuments({ conversationId });

      // Mark messages as read
      await Message.updateMany(
        {
          conversationId,
          recipientId: userId,
          read: false,
        },
        { read: true }
      );

      // Update conversation unread count
      await Conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${userId}`]: 0,
      });

      return res.status(200).json({
        success: true,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get conversation messages error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get user's conversations
   * GET /api/messages/conversations
   */
  async getConversations(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate("participants", "name profileImage email")
        .sort("-lastMessageAt")
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Conversation.countDocuments({
        participants: userId,
      });

      return res.status(200).json({
        success: true,
        conversations: conversations.map((conv) => ({
          ...conv.toObject(),
          otherUser: conv.participants.find((p) => p._id.toString() !== userId),
          unreadCount: conv.unreadCount?.[userId] || 0,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch conversations",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get or create conversation with a user
   * POST /api/messages/conversation
   */
  async getOrCreateConversation(req, res) {
    try {
      const userId = req.user?.id;
      const { otherUserId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "Other user ID is required",
        });
      }

      const participants = [
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(otherUserId),
      ].sort((a, b) => a.toString().localeCompare(b.toString()));

      let conversation = await Conversation.findOne({
        participants: { $all: participants },
      }).populate("participants", "name profileImage email");

      if (!conversation) {
        conversation = new Conversation({
          participants,
          unreadCount: {},
        });
        await conversation.save();
        await conversation.populate("participants", "name profileImage email");
      }

      return res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error("Get or create conversation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get or create conversation",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Mark message as read
   * PATCH /api/messages/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const message = await Message.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      if (message.recipientId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only mark your own messages as read",
        });
      }

      message.read = true;
      await message.save();

      return res.status(200).json({
        success: true,
        message: "Message marked as read",
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark message as read",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete message
   * DELETE /api/messages/:id
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const message = await Message.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      if (message.senderId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own messages",
        });
      }

      await Message.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Delete message error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete message",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new MessageController();
