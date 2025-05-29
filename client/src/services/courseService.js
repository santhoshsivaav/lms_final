import api from '../api/api';

export const courseService = {
    // Get all published courses
    getAllCourses: async () => {
        try {
            console.log('Making API call to fetch courses...');
            const response = await api.get('/courses');
            console.log('API Response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch courses');
            }

            return response.data.data;
        } catch (error) {
            console.error('Error in getAllCourses:', error);
            throw error;
        }
    },

    // Get course by ID with videos
    getCourseById: async (courseId) => {
        try {
            const response = await api.get(`/courses/${courseId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch course');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in getCourseById:', error);
            throw error;
        }
    },

    // Get video details with watermarked URL
    getVideoDetails: async (courseId, videoId) => {
        try {
            const response = await api.get(`/courses/${courseId}/lesson/${videoId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch video details');
            }

            // Ensure we have content and videoUrl in content
            if (!response.data.data.content?.videoUrl) {
                throw new Error('Video URL not found in lesson content');
            }

            return response.data.data;
        } catch (error) {
            console.error('Error in getVideoDetails:', error);
            throw error;
        }
    },

    // Get course progress
    getCourseProgress: async (courseId) => {
        try {
            const response = await api.get(`/courses/${courseId}/progress`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch course progress');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in getCourseProgress:', error);
            throw error;
        }
    },

    // Update video progress
    updateVideoProgress: async (videoId, progress) => {
        try {
            const response = await api.post(`/videos/${videoId}/progress`, { progress });
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update video progress');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in updateVideoProgress:', error);
            throw error;
        }
    },

    // Mark video as completed
    markVideoCompleted: async (videoId) => {
        try {
            const response = await api.post(`/videos/${videoId}/complete`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to mark video as completed');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in markVideoCompleted:', error);
            throw error;
        }
    },

    // Search courses
    searchCourses: async (query) => {
        try {
            const response = await api.get(`/courses/search?query=${encodeURIComponent(query)}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to search courses');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in searchCourses:', error);
            throw error;
        }
    },

    // Get enrolled courses
    getEnrolledCourses: async () => {
        try {
            console.log('Fetching enrolled courses...');
            const response = await api.get('/courses/enrolled');
            console.log('Enrolled courses response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch enrolled courses');
            }

            // Return empty array if no courses are found
            return response.data.data || [];
        } catch (error) {
            console.error('Error in getEnrolledCourses:', error);
            // Return empty array instead of throwing error
            return [];
        }
    },

    // Get video player URL
    getVideoPlayerUrl: async (courseId, lessonId) => {
        try {
            console.log('Making API call to get video player URL:', { courseId, lessonId });
            const response = await api.get(`/courses/${courseId}/player/${lessonId}`);
            console.log('Video player URL response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch video player URL');
            }
            return response.data.data;
        } catch (error) {
            console.error('Error in getVideoPlayerUrl:', error);
            throw error;
        }
    }
}; 