// const mongoose = require("mongoose");

// const userMessageSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//     message: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
//   },
//   { collection: 'UserMessages' }
// );

// const botMessageSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//     message: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
//   },
//   { collection: 'BotMessages' }
// );

// const UserMessage = mongoose.model('UserMessage', userMessageSchema);
// const BotMessage = mongoose.model('BotMessage', botMessageSchema);

// module.exports = { UserMessage, BotMessage };

const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', chatHistorySchema);

module.exports = { Message }; // Đảm bảo xuất đúng model
