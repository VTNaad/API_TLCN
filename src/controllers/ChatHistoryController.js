const { Message } = require('../models/ChatHistory'); // Nhập mô hình Message

class ChatHistoryController {
  // [POST] /chathistory/save/:userId
  async saveMessage(req, res) {
    const { userId } = req.params;
    const { message, sender } = req.body;

    if (!message || !sender) {
      return res.status(400).json({
        success: false,
        message: "Message and sender are required.",
      });
    }

    try {
      const newMessage = new Message({ userId, message, sender });
      await newMessage.save();

      res.status(201).json({
        success: true,
        message: "Message saved successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error saving message.",
      });
    }
  }

  // [GET] /chathistory/:userId
  async getChatHistory(req, res) {
    const { userId } = req.params;

    try {
      // Lấy tất cả tin nhắn từ người dùng và bot (theo userId)
      const messages = await Message.find({ userId })
        .select('message sender createdAt')  // Chỉ lấy các trường cần thiết
        .exec();

      // Kết hợp tin nhắn của người dùng và bot
      const combinedMessages = messages.map(msg => ({
        text: msg.message,
        sender: msg.sender,
        createdAt: msg.createdAt
      }));

      // Sắp xếp tất cả tin nhắn theo thời gian createdAt từ bé đến lớn
      combinedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      res.status(200).json({
        success: true,
        data: combinedMessages,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error retrieving chat history.",
      });
    }
  }

  // [DELETE] /chathistory/:userId
  async deleteChatHistory(req, res) {
    const { userId } = req.params;

    try {
      await Message.deleteMany({ userId });

      res.status(200).json({
        success: true,
        message: "Chat history deleted successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error deleting chat history.",
      });
    }
  }
}

module.exports = new ChatHistoryController();
