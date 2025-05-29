import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardMedia
} from '@mui/material';
import {
    PlayCircleOutline as PlayIcon,
    Lock as LockIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { courseService } from '../services/courseService';
import { useAuth } from '../contexts/AuthContext';

const CourseDetail = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [progress, setProgress] = useState({});

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const [courseData, progressData] = await Promise.all([
                courseService.getCourseById(courseId),
                courseService.getCourseProgress(courseId)
            ]);
            setCourse(courseData);
            setProgress(progressData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch course details. Please try again later.');
            console.error('Error fetching course details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVideoSelect = async (video) => {
        try {
            const videoDetails = await courseService.getVideoDetails(courseId, video._id);
            setSelectedVideo(videoDetails);
        } catch (err) {
            console.error('Error fetching video details:', err);
        }
    };

    const handleVideoProgress = async (videoId, currentTime) => {
        try {
            await courseService.updateVideoProgress(videoId, currentTime);
        } catch (err) {
            console.error('Error updating video progress:', err);
        }
    };

    const handleVideoComplete = async (videoId) => {
        try {
            await courseService.markVideoCompleted(videoId);
            fetchCourseDetails(); // Refresh progress
        } catch (err) {
            console.error('Error marking video as complete:', err);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!course) {
        return (
            <Container>
                <Alert severity="info">Course not found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={4}>
                {/* Course Header */}
                <Grid item xs={12}>
                    <Card>
                        <CardMedia
                            component="img"
                            height="300"
                            image={course.thumbnail}
                            alt={course.title}
                        />
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                {course.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                                {course.description}
                            </Typography>
                            <Box display="flex" gap={2} alignItems="center">
                                <Typography variant="h6" color="primary">
                                    ${course.price}
                                </Typography>
                                {!user?.isSubscribed && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        onClick={() => {/* handle subscribe logic here */ }}
                                    >
                                        Subscribe to access all content
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                {/* Course Content */}
                <Grid item xs={12} md={8}>
                    {selectedVideo ? (
                        <Paper sx={{ p: 2 }}>
                            <video
                                controls
                                width="100%"
                                src={selectedVideo.url}
                                onTimeUpdate={(e) => handleVideoProgress(selectedVideo._id, e.target.currentTime)}
                                onEnded={() => handleVideoComplete(selectedVideo._id)}
                            />
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                {selectedVideo.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedVideo.description}
                            </Typography>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Select a video to start learning
                            </Typography>
                        </Paper>
                    )}
                </Grid>

                {/* Course Modules */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Course Content
                        </Typography>
                        {!user?.isSubscribed && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Subscribe to unlock all lessons and videos!
                            </Alert>
                        )}
                        <List>
                            {course.modules.map((module) => (
                                <React.Fragment key={module._id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={module.title}
                                            secondary={`${module.lessons.length} lessons`}
                                        />
                                    </ListItem>
                                    <List component="div" disablePadding>
                                        {module.lessons.map((lesson) => {
                                            const isLocked = !user?.isSubscribed && !lesson.isPreview;
                                            return (
                                                <ListItem
                                                    key={lesson._id}
                                                    button={!isLocked}
                                                    onClick={() => !isLocked && handleVideoSelect(lesson)}
                                                    sx={{ pl: 4, opacity: isLocked ? 0.5 : 1 }}
                                                >
                                                    <ListItemIcon>
                                                        {progress[lesson._id]?.completed ? (
                                                            <CheckIcon color="success" />
                                                        ) : isLocked ? (
                                                            <LockIcon color="disabled" />
                                                        ) : (
                                                            <PlayIcon />
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={lesson.title}
                                                        secondary={`${lesson.duration} min`}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default CourseDetail; 