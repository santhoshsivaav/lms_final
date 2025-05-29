const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, admin } = require('../middleware/auth');

// Public routes
router.get('/search', courseController.searchCourses);
router.get('/videos/all', auth, admin, courseController.getAllVideos);
router.get('/enrolled', auth, courseController.getEnrolledCourses);

// Video player routes
router.get('/:courseId/player/:lessonId', auth, courseController.getVideoPlayerUrl);

// Lesson routes
router.get('/:courseId/lesson/:lessonId', auth, courseController.getLessonDetails);
router.post('/:courseId/lesson', auth, admin, courseController.addVideo);
router.put('/:courseId/lesson/:lessonId', auth, admin, courseController.updateVideo);
router.delete('/:courseId/lesson/:lessonId', auth, admin, courseController.deleteVideo);

// Course progress routes
router.get('/:courseId/progress', auth, courseController.getCourseProgress);
router.post('/:courseId/enroll', auth, courseController.enrollInCourse);

// Generic course routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', auth, admin, courseController.createCourse);
router.put('/:id', auth, admin, courseController.updateCourse);
router.delete('/:id', auth, admin, courseController.deleteCourse);

module.exports = router; 