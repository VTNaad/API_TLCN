const Notification = require('../models/Notification');

class NotificationController {
  // [POST] /notification/create
  async createNotification(req, res) {
    const { title, content, sentTime, user } = req.body;

    try {
      const newNotification = new Notification({ title, content, sentTime, user });
      await newNotification.save();

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: newNotification,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /notification
  async getAllNotifications(req, res) {
    try {
      const notifications = await Notification.find().populate('user');
      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /notification/:id
  async getNotificationById(req, res) {
    try {
      const notification = await Notification.findById(req.params.id).populate('user');
      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, data: notification });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PUT] /notification/:id
  async updateNotification(req, res) {
    const { title, content, sentTime, user, isRead } = req.body;

    try {
      const updatedNotification = await Notification.findByIdAndUpdate(
        req.params.id,
        { title, content, sentTime, user, isRead, updatedAt: Date.now() },
        { new: true }
      ).populate('user');

      if (!updatedNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      res.json({
        success: true,
        message: "Notification updated successfully",
        data: updatedNotification,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /notification/:id
  async deleteNotification(req, res) {
    try {
      const deletedNotification = await Notification.findByIdAndDelete(req.params.id);

      if (!deletedNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      res.json({
        success: true,
        message: "Notification deleted successfully",
        data: deletedNotification,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new NotificationController();