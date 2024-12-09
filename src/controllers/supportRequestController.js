const SupportRequest = require('../models/SupportRequest');

class SupportRequestController {
  // [POST] /support-request/create
  async createSupportRequest(req, res) {
    const { title, content, requestTime, user } = req.body;

    try {
      const newSupportRequest = new SupportRequest({ title, content, requestTime, user });
      await newSupportRequest.save();

      res.status(201).json({
        success: true,
        message: "Support request created successfully",
        data: newSupportRequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /support-request
  async getAllSupportRequests(req, res) {
    try {
      const supportRequests = await SupportRequest.find().populate('user');
      res.json({
        success: true,
        data: supportRequests,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /support-request/:id
  async getSupportRequestById(req, res) {
    try {
      const supportRequest = await SupportRequest.findById(req.params.id).populate('user');
      if (!supportRequest) {
        return res.status(404).json({ success: false, message: "Support request not found" });
      }
      res.json({ success: true, data: supportRequest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PUT] /support-request/:id
  async updateSupportRequest(req, res) {
    const { title, content, requestTime, user, isResolved } = req.body;

    try {
      const updatedSupportRequest = await SupportRequest.findByIdAndUpdate(
        req.params.id,
        { title, content, requestTime, user, isResolved, updatedAt: Date.now() },
        { new: true }
      ).populate('user');

      if (!updatedSupportRequest) {
        return res.status(404).json({ success: false, message: "Support request not found" });
      }

      res.json({
        success: true,
        message: "Support request updated successfully",
        data: updatedSupportRequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /support-request/:id
  async deleteSupportRequest(req, res) {
    try {
      const deletedSupportRequest = await SupportRequest.findByIdAndDelete(req.params.id);

      if (!deletedSupportRequest) {
        return res.status(404).json({ success: false, message: "Support request not found" });
      }

      res.json({
        success: true,
        message: "Support request deleted successfully",
        data: deletedSupportRequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SupportRequestController();