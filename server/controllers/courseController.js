const Course = require('../models/Course');
const Video = require('../models/Video');
const { uploadImage, uploadVideo, generateWatermarkedVideoUrl } = require('../utils/cloudinary');
const User = require('../models/User');

/**
 * Get all courses
 */
const getAllCourses = async (req, res) => {
    try {
        console.log('Fetching all courses...');
        const courses = await Course.find()
            .select('-videos')
            .sort({ createdAt: -1 });

        console.log('Courses found:', courses.length);
        console.log('First course:', courses[0]);

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Error in getAllCourses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: error.message
        });
    }
};

/**
 * Search courses by title or description
 */
const searchCourses = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const courses = await Course.find({
            $text: { $search: query }
        })
            .select('-videos')
            .sort({ score: { $meta: 'textScore' } });

        res.json(courses);
    } catch (error) {
        console.error('Error searching courses:', error);
        res.status(500).json({ message: 'Failed to search courses' });
    }
};

/**
 * Get course by ID with videos
 */
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching course by ID:', id);

        const course = await Course.findOne({ _id: id });

        if (!course) {
            console.log('Course not found');
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        console.log('Course found:', course.title);

        // Sort modules and lessons by order
        if (course.modules) {
            course.modules.sort((a, b) => a.order - b.order);
            course.modules.forEach(module => {
                if (module.lessons) {
                    module.lessons.sort((a, b) => a.order - b.order);
                }
            });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: error.message
        });
    }
};

/**
 * Get lesson details
 */
const getLessonDetails = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let lesson = null;
        for (const module of course.modules) {
            const foundLesson = module.lessons.id(lessonId);
            if (foundLesson) {
                lesson = foundLesson;
                break;
            }
        }

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Generate watermarked URL if user is logged in
        if (lesson.videoUrl && req.user) {
            lesson.videoUrl = generateWatermarkedVideoUrl(lesson.videoUrl, req.user.email);
        }

        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson details:', error);
        res.status(500).json({ message: 'Failed to fetch lesson details' });
    }
};

/**
 * Get course progress
 */
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const user = await User.findById(userId).populate('progress');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const progress = user.progress.find(p => p.courseId.toString() === courseId);
        if (!progress) {
            return res.json({
                completedLessons: [],
                totalLessons: course.modules.reduce((acc, module) => acc + module.lessons.length, 0),
                progress: 0
            });
        }

        res.json(progress);
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ message: 'Failed to fetch course progress' });
    }
};

/**
 * Get enrolled courses
 */
const getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate('progress');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const courseIds = user.progress.map(p => p.courseId);
        const courses = await Course.find({ _id: { $in: courseIds } })
            .select('-videos');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ message: 'Failed to fetch enrolled courses' });
    }
};

/**
 * Enroll in course
 */
const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already enrolled
        const isEnrolled = user.progress.some(p => p.courseId.toString() === courseId);
        if (isEnrolled) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Add course to user's progress
        user.progress.push({
            courseId,
            completedLessons: [],
            lastAccessed: new Date()
        });

        await user.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ message: 'Failed to enroll in course' });
    }
};

/**
 * Get video details with watermarked URL
 */
const getVideoDetails = async (req, res) => {
    try {
        const { courseId, videoId } = req.params;
        console.log('Fetching video details:', { courseId, videoId });

        // First check if course exists
        const course = await Course.findById(courseId);
        console.log('Course found:', course ? 'Yes' : 'No');

        if (!course) {
            console.log('Course not found with ID:', courseId);
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Find the video in the course modules
        let video = null;
        for (const module of course.modules || []) {
            console.log('Checking module:', module.title);
            const foundVideo = module.lessons?.find(lesson => lesson._id.toString() === videoId);
            if (foundVideo) {
                console.log('Found lesson:', {
                    id: foundVideo._id,
                    title: foundVideo.title,
                    content: foundVideo.content
                });

                // Check for video URL in content object
                if (!foundVideo.content?.videoUrl) {
                    console.log('No video URL found in lesson content');
                    continue;
                }

                // Create video object with all necessary fields
                video = {
                    _id: foundVideo._id,
                    title: foundVideo.title,
                    description: foundVideo.description,
                    type: foundVideo.type,
                    content: foundVideo.content,
                    order: foundVideo.order,
                    videoUrl: foundVideo.content.videoUrl // Set videoUrl at top level for client
                };
                console.log('Video found in module:', module.title);
                break;
            }
        }

        if (!video) {
            console.log('Video not found with ID:', videoId);
            return res.status(404).json({
                success: false,
                message: 'Video not found in course'
            });
        }

        // Generate watermarked URL if user is logged in
        if (video.videoUrl && req.user) {
            video.videoUrl = await generateWatermarkedVideoUrl(video.videoUrl, req.user.email);
        }

        console.log('Sending video response:', {
            videoId: video._id,
            hasVideoUrl: !!video.videoUrl
        });

        res.json({
            success: true,
            data: video
        });
    } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video details',
            error: error.message
        });
    }
};

/**
 * Get video player URL
 */
const getVideoPlayerUrl = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        console.log('Fetching video player URL:', { courseId, lessonId });

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Find the lesson in modules
        let lesson = null;
        for (const module of course.modules) {
            const foundLesson = module.lessons.find(l => l._id.toString() === lessonId);
            if (foundLesson) {
                lesson = foundLesson;
                break;
            }
        }

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check if video URL exists
        if (!lesson.content?.videoUrl) {
            return res.status(404).json({
                success: false,
                message: 'Video URL not found in lesson'
            });
        }

        // Generate watermarked URL if user is logged in
        let videoUrl = lesson.content.videoUrl;
        if (req.user) {
            videoUrl = await generateWatermarkedVideoUrl(videoUrl, req.user.email);
        }

        // Return the video player data
        res.json({
            success: true,
            data: {
                _id: lesson._id,
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                videoUrl: videoUrl,
                order: lesson.order
            }
        });
    } catch (error) {
        console.error('Error fetching video player URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video player URL',
            error: error.message
        });
    }
};

/**
 * Create a new course (admin only)
 */
const createCourse = async (req, res) => {
    try {
        console.log('Creating course with data:', req.body);
        console.log('User from request:', req.user);

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can create courses'
            });
        }

        // Validate required fields
        const { title, description, thumbnail } = req.body;

        if (!title || !description || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, and thumbnail are required'
            });
        }

        // Create new course
        const courseData = {
            title,
            description,
            thumbnail,
            tags: req.body.tags || [],
            skills: req.body.skills || [],
            modules: req.body.modules || [],
            status: 'draft'
        };

        console.log('Creating course with data:', courseData);
        const course = new Course(courseData);

        console.log('Saving course:', course);
        await course.save();
        console.log('Course saved successfully');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
};

/**
 * Update a course (admin only)
 */
const updateCourse = async (req, res) => {
    try {
        console.log('Updating course:', req.params.id);
        const { title, description, thumbnail, tags, skills, modules } = req.body;

        // Find course
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Update course fields
        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail) course.thumbnail = thumbnail;
        if (tags) course.tags = tags;
        if (skills) course.skills = skills;
        if (modules) course.modules = modules;

        // Save updated course
        await course.save();
        console.log('Course updated successfully:', course._id);

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
};

/**
 * Delete a course (admin only)
 */
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Also delete all videos associated with this course
        await Video.deleteMany({ courseId: id });

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Failed to delete course' });
    }
};

/**
 * Add a video to a course (admin only)
 */
const addVideo = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, duration, order, isPreview } = req.body;

        if (!title || !duration || order === undefined) {
            return res.status(400).json({ message: 'Title, duration and order are required' });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Handle video upload
        let videoUrl = '';
        let thumbnailUrl = '';

        if (req.files && req.files.video) {
            const videoResult = await uploadVideo(req.files.video[0].path);
            videoUrl = videoResult.secure_url;

            // Use video thumbnail if available
            if (videoResult.thumbnail_url) {
                thumbnailUrl = videoResult.thumbnail_url;
            }
        } else {
            return res.status(400).json({ message: 'Video file is required' });
        }

        // Use custom thumbnail if provided
        if (req.files && req.files.thumbnail) {
            const thumbnailResult = await uploadImage(req.files.thumbnail[0].path);
            thumbnailUrl = thumbnailResult.secure_url;
        }

        const video = {
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl,
            duration: Number(duration),
            order: Number(order),
            isPreview: Boolean(isPreview)
        };

        course.videos.push(video);
        await course.save();

        res.status(201).json(course);
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ message: 'Failed to add video' });
    }
};

/**
 * Update a video (admin only)
 */
const updateVideo = async (req, res) => {
    try {
        const { courseId, videoId } = req.params;
        const { title, description, duration, order, isPreview } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const video = course.videos.id(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Update fields if provided
        if (title) video.title = title;
        if (description !== undefined) video.description = description;
        if (duration) video.duration = Number(duration);
        if (order !== undefined) video.order = Number(order);
        if (isPreview !== undefined) video.isPreview = Boolean(isPreview);

        // Handle video update
        if (req.files && req.files.video) {
            const videoResult = await uploadVideo(req.files.video[0].path);
            video.videoUrl = videoResult.secure_url;

            // Use video thumbnail if available and no custom thumbnail
            if (videoResult.thumbnail_url && !req.files.thumbnail) {
                video.thumbnailUrl = videoResult.thumbnail_url;
            }
        }

        // Handle thumbnail update
        if (req.files && req.files.thumbnail) {
            const thumbnailResult = await uploadImage(req.files.thumbnail[0].path);
            video.thumbnailUrl = thumbnailResult.secure_url;
        }

        await course.save();

        res.json(course);
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ message: 'Failed to update video' });
    }
};

/**
 * Delete a video (admin only)
 */
const deleteVideo = async (req, res) => {
    try {
        const { courseId, videoId } = req.params;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);

        if (videoIndex === -1) {
            return res.status(404).json({ message: 'Video not found' });
        }

        course.videos.splice(videoIndex, 1);
        await course.save();

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ message: 'Failed to delete video' });
    }
};

/**
 * Get all videos (admin only)
 */
const getAllVideos = async (req, res) => {
    try {
        const courses = await Course.find()
            .select('videos title')
            .lean();

        const videos = courses.reduce((acc, course) => {
            const courseVideos = course.videos.map(video => ({
                ...video,
                courseId: course._id,
                courseTitle: course.title
            }));
            return [...acc, ...courseVideos];
        }, []);

        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Failed to fetch videos' });
    }
};

module.exports = {
    getAllCourses,
    searchCourses,
    getCourseById,
    getVideoDetails,
    getVideoPlayerUrl,
    createCourse,
    updateCourse,
    deleteCourse,
    addVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getEnrolledCourses,
    enrollInCourse,
    getCourseProgress,
    getLessonDetails
}; 