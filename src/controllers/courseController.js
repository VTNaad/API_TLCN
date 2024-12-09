const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

class courseController {
  // [POST] /course/create
  async createCourse(req, res) {
    const { title, description } = req.body; // Removed price

    try {
      const newCourse = new Course({ title, description }); // No price field
      await newCourse.save();
      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: newCourse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /course/
  async getAllCourses(req, res) {
    try {
      const courses = await Course.find().populate("lessons");
      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /course/:id
  async getCourseById(req, res) {
    const { id } = req.params;

    try {
      const course = await Course.findById(id).populate("lessons");
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      res.status(200).json({ success: true, data: course });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PUT] /course/:id
  async updateCourse(req, res) {
    const { id } = req.params;
    const { title, description } = req.body; // Removed price

    try {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      course.title = title || course.title;
      course.description = description || course.description;
      await course.save();

      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: course,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /course/:id
  async deleteCourse(req, res) {
    const { id } = req.params;

    try {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      await Course.delete({ _id: id });
      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /course/:id/force
  async forceDeleteCourse(req, res) {
    const { id } = req.params;

    try {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      await Course.deleteOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Course force-deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PATCH] /course/:id/restore
  async restoreCourse(req, res) {
    const { id } = req.params;

    try {
      await Course.restore({ _id: id });
      const restoredCourse = await Course.findById(id);
      if (!restoredCourse) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      res.status(200).json({
        success: true,
        message: "Course restored successfully",
        data: restoredCourse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /course/:id/lessons
  async getLessonsByCourseId(req, res) {
    const { id } = req.params;

    try {
      const course = await Course.findById(id).populate("lessons");

      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      res.status(200).json({
        success: true,
        message: "Lessons retrieved successfully",
        data: course.lessons,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [POST] /course/:courseId/lesson/add
  async addLessonToCourse(req, res) {
    const { courseId, lessonId } = req.params; // Extract courseId and lessonId from URL parameters
  
    try {
      // Find the course and lesson by their respective IDs
      const course = await Course.findById(courseId);
      const lesson = await Lesson.findById(lessonId);
  
      // Check if course exists
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
  
      // Check if lesson exists
      if (!lesson) {
        return res.status(404).json({ success: false, message: "Lesson not found" });
      }
  
      // Check if lesson is already added to the course
      if (course.lessons.includes(lessonId)) {
        return res.status(400).json({
          success: false,
          message: "Lesson already added to this course",
        });
      }
  
      // Add the lesson to the course's lessons array
      course.lessons.push(lessonId);
  
      // Save the updated course document
      await course.save();
  
      // Return a success response
      res.status(200).json({
        success: true,
        message: "Lesson added to course successfully",
        data: course,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /course/:courseId/lesson/:lessonId
  async removeLessonFromCourse(req, res) {
    const { courseId, lessonId } = req.params;

    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      course.lessons = course.lessons.filter((id) => id.toString() !== lessonId);
      await course.save();

      res.status(200).json({
        success: true,
        message: "Lesson removed from course successfully",
        data: course,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /course/title/:title
  async searchCoursesByTitle(req, res) {
    const { title } = req.params; // Lấy title từ params

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Search title is required" });
    }

    try {
      // Sử dụng $regex để tìm kiếm chuỗi trong title (không phân biệt chữ hoa/thường)
      const courses = await Course.find({
        title: { $regex: title, $options: "i" },
      });

      if (courses.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No courses found matching title: "${title}"`,
        });
      }

      res.status(200).json({
        success: true,
        message: `Courses found matching title: "${title}"`,
        data: courses,
      });
    } catch (error) {
      console.error("Error in searchCoursesByTitle:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while searching for courses",
      });
    }
  }
}

module.exports = new courseController();
