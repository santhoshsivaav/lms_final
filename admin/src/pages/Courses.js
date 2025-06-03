import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Snackbar,
    Alert,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: '',
        category: '',
        tags: [],
        skills: [],
        modules: []
    });
    const [currentTag, setCurrentTag] = useState('');
    const [currentSkill, setCurrentSkill] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [currentModule, setCurrentModule] = useState({
        title: '',
        description: '',
        order: 1,
        lessons: []
    });
    const [currentLesson, setCurrentLesson] = useState({
        title: '',
        description: '',
        type: 'video',
        content: {
            videoUrl: ''
        },
        order: 1
    });
    const [videoFile, setVideoFile] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchCategories();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://192.168.75.119:5000/api/courses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const result = await response.json();
            console.log('Courses API Response:', result);

            if (response.ok) {
                if (result.data && Array.isArray(result.data)) {
                    setCourses(result.data);
                } else if (Array.isArray(result)) {
                    setCourses(result);
                } else {
                    console.error('Invalid response format:', result);
                    setError('Invalid data format received');
                    setCourses([]);
                }
            } else {
                setError(result.message || 'Failed to fetch courses');
                setCourses([]);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('An error occurred while fetching courses');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://192.168.75.119:5000/api/categories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setCategories(result.data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleOpenDialog = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                title: course.title || '',
                description: course.description || '',
                thumbnail: course.thumbnail || '',
                category: course.category?._id || '',
                tags: course.tags || [],
                skills: course.skills || [],
                modules: course.modules || []
            });
        } else {
            setEditingCourse(null);
            setFormData({
                title: '',
                description: '',
                thumbnail: '',
                category: '',
                tags: [],
                skills: [],
                modules: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCourse(null);
        setFormData({
            title: '',
            description: '',
            thumbnail: '',
            category: '',
            tags: [],
            skills: [],
            modules: []
        });
        setCurrentModule({
            title: '',
            description: '',
            order: 1,
            lessons: []
        });
        setCurrentLesson({
            title: '',
            description: '',
            type: 'video',
            content: {
                videoUrl: ''
            },
            order: 1
        });
    };

    const handleThumbnailChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'ml_default');
                formData.append('cloud_name', 'doxxdj16r');

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/doxxdj16r/image/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                const data = await response.json();
                setFormData(prev => ({ ...prev, thumbnail: data.secure_url }));
            } catch (err) {
                setError('Failed to upload thumbnail');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleVideoUpload = async (event, moduleIndex, lessonIndex) => {
        const file = event.target.files[0];
        if (file) {
            setUploadingVideo(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'ml_default');
                formData.append('cloud_name', 'doxxdj16r');

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/doxxdj16r/video/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                const data = await response.json();

                if (moduleIndex !== undefined && lessonIndex !== undefined) {
                    // Editing existing lesson
                    handleEditLesson(moduleIndex, lessonIndex, 'videoUrl', data.secure_url);
                } else {
                    // Adding new lesson
                    setCurrentLesson(prev => ({
                        ...prev,
                        content: { ...prev.content, videoUrl: data.secure_url }
                    }));
                }
            } catch (err) {
                setError('Failed to upload video');
            } finally {
                setUploadingVideo(false);
            }
        }
    };

    const handleAddTag = () => {
        if (currentTag && !formData.tags.includes(currentTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, currentTag]
            }));
            setCurrentTag('');
        }
    };

    const handleAddSkill = () => {
        if (currentSkill && !formData.skills.includes(currentSkill)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, currentSkill]
            }));
            setCurrentSkill('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleAddModule = () => {
        if (currentModule.title && currentModule.description) {
            setFormData(prev => ({
                ...prev,
                modules: [...prev.modules, {
                    ...currentModule,
                    order: prev.modules.length + 1,
                    lessons: []
                }]
            }));
            setCurrentModule({
                title: '',
                description: '',
                order: 1,
                lessons: []
            });
        }
    };

    const handleAddLesson = (moduleIndex) => {
        if (currentLesson.title && currentLesson.description && currentLesson.content.videoUrl) {
            setFormData(prev => ({
                ...prev,
                modules: prev.modules.map((module, index) => {
                    if (index === moduleIndex) {
                        return {
                            ...module,
                            lessons: [...module.lessons, {
                                ...currentLesson,
                                order: module.lessons.length + 1
                            }]
                        };
                    }
                    return module;
                })
            }));
            setCurrentLesson({
                title: '',
                description: '',
                type: 'video',
                content: {
                    videoUrl: ''
                },
                order: 1
            });
        }
    };

    const handleRemoveModule = (moduleIndex) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules.filter((_, i) => i !== moduleIndex).map((module, index) => ({
                ...module,
                order: index + 1
            }))
        }));
    };

    const handleRemoveLesson = (moduleIndex, lessonIndex) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules.map((module, index) => {
                if (index === moduleIndex) {
                    return {
                        ...module,
                        lessons: module.lessons
                            .filter((_, j) => j !== lessonIndex)
                            .map((lesson, index) => ({
                                ...lesson,
                                order: index + 1
                            }))
                    };
                }
                return module;
            })
        }));
    };

    const handleEditModule = (moduleIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules.map((module, index) => {
                if (index === moduleIndex) {
                    return { ...module, [field]: value };
                }
                return module;
            })
        }));
    };

    const handleEditLesson = (moduleIndex, lessonIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules.map((module, index) => {
                if (index === moduleIndex) {
                    return {
                        ...module,
                        lessons: module.lessons.map((lesson, lIndex) => {
                            if (lIndex === lessonIndex) {
                                if (field === 'videoUrl') {
                                    return {
                                        ...lesson,
                                        content: { ...lesson.content, videoUrl: value }
                                    };
                                }
                                return { ...lesson, [field]: value };
                            }
                            return lesson;
                        })
                    };
                }
                return module;
            })
        }));
    };

    const validateCourse = () => {
        const errors = [];

        if (!formData.title?.trim()) {
            errors.push('Course title is required');
        }
        if (!formData.description?.trim()) {
            errors.push('Course description is required');
        }
        if (!formData.thumbnail) {
            errors.push('Course thumbnail is required');
        }
        if (!formData.modules?.length) {
            errors.push('At least one module is required');
        } else {
            formData.modules.forEach((module, index) => {
                if (!module.title?.trim()) {
                    errors.push(`Module ${index + 1}: Title is required`);
                }
                if (!module.description?.trim()) {
                    errors.push(`Module ${index + 1}: Description is required`);
                }
                if (!module.lessons?.length) {
                    errors.push(`Module ${index + 1}: At least one lesson is required`);
                } else {
                    module.lessons.forEach((lesson, lessonIndex) => {
                        if (!lesson.title?.trim()) {
                            errors.push(`Module ${index + 1}, Lesson ${lessonIndex + 1}: Title is required`);
                        }
                        if (!lesson.description?.trim()) {
                            errors.push(`Module ${index + 1}, Lesson ${lessonIndex + 1}: Description is required`);
                        }
                        if (!lesson.content?.videoUrl) {
                            errors.push(`Module ${index + 1}, Lesson ${lessonIndex + 1}: Video is required`);
                        }
                    });
                }
            });
        }

        return errors;
    };

    const handleSubmit = async () => {
        try {
            // Validate the course data
            const validationErrors = validateCourse();
            if (validationErrors.length > 0) {
                setError(validationErrors.join('\n'));
                return;
            }

            // Get the token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please login again.');
                return;
            }

            // Format the data to ensure all fields are properly structured
            const formattedData = {
                title: formData.title,
                description: formData.description,
                thumbnail: formData.thumbnail,
                category: formData.category,
                tags: formData.tags,
                skills: formData.skills,
                modules: formData.modules.map((module, index) => ({
                    title: module.title,
                    description: module.description,
                    order: index + 1,
                    lessons: module.lessons.map((lesson, lessonIndex) => ({
                        title: lesson.title,
                        description: lesson.description,
                        type: 'video',
                        content: {
                            videoUrl: lesson.content.videoUrl
                        },
                        order: lessonIndex + 1
                    }))
                }))
            };

            const url = editingCourse
                ? `http://192.168.75.119:5000/api/courses/${editingCourse._id}`
                : 'http://192.168.75.119:5000/api/courses';

            console.log('Submitting course data:', formattedData);

            const response = await fetch(url, {
                method: editingCourse ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formattedData),
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok && result.data) {
                // Show success message
                setSuccessMessage(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
                setShowSuccess(true);

                // Close the dialog
                handleCloseDialog();

                // Refresh the courses list
                await fetchCourses();

                // Wait for 2 seconds to show the success message before redirecting
                setTimeout(() => {
                    navigate('/courses');
                }, 2000);
            } else {
                if (response.status === 401) {
                    setError('Authentication failed. Please login again.');
                    // Optionally redirect to login page
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                } else {
                    setError(result.message || 'Failed to save course');
                }
            }
        } catch (err) {
            console.error('Error saving course:', err);
            setError('An error occurred while saving the course');
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Courses</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Course
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {courses.length === 0 ? (
                        <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary" align="center">
                                No courses found
                            </Typography>
                        </Grid>
                    ) : (
                        courses.map((course) => (
                            <Grid item xs={12} sm={6} md={4} key={course._id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            boxShadow: 6,
                                            '& .MuiCardActions-root': {
                                                opacity: 1
                                            }
                                        }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={course.thumbnail || 'https://res.cloudinary.com/doxxdj16r/image/upload/v1/samples/landscapes/nature-mountains.jpg'}
                                        alt={course.title}
                                        sx={{ objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://res.cloudinary.com/doxxdj16r/image/upload/v1/samples/landscapes/nature-mountains.jpg';
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h5" component="h2">
                                            {course.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {course.description}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Tags:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {course.tags.map((tag) => (
                                                    <Chip
                                                        key={tag}
                                                        label={tag}
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Skills:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {course.skills.map((skill) => (
                                                    <Chip
                                                        key={skill}
                                                        label={skill}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2">
                                                Modules: {course.modules.length}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <CardActions
                                        sx={{
                                            opacity: 0.7,
                                            transition: 'opacity 0.2s',
                                            justifyContent: 'flex-end',
                                            p: 2
                                        }}
                                    >
                                        <IconButton
                                            onClick={() => handleOpenDialog(course)}
                                            color="primary"
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingCourse ? 'Edit Course' : 'Create New Course'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Title"
                                fullWidth
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={formData.category}
                                    label="Category"
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category._id} value={category._id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Course Thumbnail</Typography>
                                <input
                                    accept="image/*"
                                    type="file"
                                    id="thumbnail-upload"
                                    onChange={handleThumbnailChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="thumbnail-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Thumbnail'}
                                    </Button>
                                </label>
                                {formData.thumbnail && (
                                    <Box sx={{ mt: 1 }}>
                                        <img
                                            src={formData.thumbnail}
                                            alt="Thumbnail preview"
                                            style={{ maxWidth: '200px', maxHeight: '200px' }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Course Tags</Typography>
                                <TextField
                                    label="Add Tag"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                    sx={{ mr: 1 }}
                                />
                                <Button onClick={handleAddTag}>Add Tag</Button>
                                <Box sx={{ mt: 1 }}>
                                    {formData.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => handleRemoveTag(tag)}
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Required Skills</Typography>
                                <TextField
                                    label="Add Skill"
                                    value={currentSkill}
                                    onChange={(e) => setCurrentSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                    sx={{ mr: 1 }}
                                />
                                <Button onClick={handleAddSkill}>Add Skill</Button>
                                <Box sx={{ mt: 1 }}>
                                    {formData.skills.map((skill) => (
                                        <Chip
                                            key={skill}
                                            label={skill}
                                            onDelete={() => handleRemoveSkill(skill)}
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" gutterBottom>Course Modules</Typography>
                                {formData.modules.map((module, moduleIndex) => (
                                    <Accordion key={moduleIndex} sx={{ mt: 2 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography>Module {module.order}: {module.title}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TextField
                                                fullWidth
                                                label="Module Title"
                                                value={module.title}
                                                onChange={(e) => handleEditModule(moduleIndex, 'title', e.target.value)}
                                                sx={{ mb: 2 }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Module Description"
                                                multiline
                                                rows={2}
                                                value={module.description}
                                                onChange={(e) => handleEditModule(moduleIndex, 'description', e.target.value)}
                                                sx={{ mb: 2 }}
                                            />

                                            <Typography variant="subtitle1" gutterBottom>Module Lessons</Typography>
                                            {module.lessons.map((lesson, lessonIndex) => (
                                                <Paper key={lessonIndex} sx={{ p: 2, mb: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Lesson Title"
                                                        value={lesson.title}
                                                        onChange={(e) => handleEditLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Lesson Description"
                                                        multiline
                                                        rows={2}
                                                        value={lesson.description}
                                                        onChange={(e) => handleEditLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" gutterBottom>Video</Typography>
                                                        <input
                                                            accept="video/*"
                                                            type="file"
                                                            id={`video-upload-${moduleIndex}-${lessonIndex}`}
                                                            onChange={(e) => handleVideoUpload(e, moduleIndex, lessonIndex)}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <label htmlFor={`video-upload-${moduleIndex}-${lessonIndex}`}>
                                                            <Button
                                                                variant="outlined"
                                                                component="span"
                                                                startIcon={<VideoLibraryIcon />}
                                                                disabled={uploadingVideo}
                                                            >
                                                                {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                                                            </Button>
                                                        </label>
                                                        {lesson.content.videoUrl && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant="body2" color="success.main">
                                                                    Video uploaded successfully
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    URL: {lesson.content.videoUrl}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveLesson(moduleIndex, lessonIndex)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Paper>
                                            ))}

                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>Add New Lesson</Typography>
                                                <TextField
                                                    fullWidth
                                                    label="Lesson Title"
                                                    value={currentLesson.title}
                                                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                                                    sx={{ mb: 1 }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Lesson Description"
                                                    multiline
                                                    rows={2}
                                                    value={currentLesson.description}
                                                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, description: e.target.value }))}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Box sx={{ mb: 1 }}>
                                                    <input
                                                        accept="video/*"
                                                        type="file"
                                                        id={`new-video-upload-${moduleIndex}`}
                                                        onChange={(e) => handleVideoUpload(e, moduleIndex)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor={`new-video-upload-${moduleIndex}`}>
                                                        <Button
                                                            variant="outlined"
                                                            component="span"
                                                            startIcon={<VideoLibraryIcon />}
                                                            disabled={uploadingVideo}
                                                        >
                                                            {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                                                        </Button>
                                                    </label>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => handleAddLesson(moduleIndex)}
                                                    startIcon={<AddIcon />}
                                                    disabled={!currentLesson.title || !currentLesson.description || !currentLesson.content.videoUrl}
                                                >
                                                    Add Lesson to Module
                                                </Button>
                                            </Box>

                                            <IconButton
                                                onClick={() => handleRemoveModule(moduleIndex)}
                                                color="error"
                                                sx={{ mt: 1 }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}

                                <Paper sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Add New Module</Typography>
                                    <TextField
                                        fullWidth
                                        label="Module Title"
                                        value={currentModule.title}
                                        onChange={(e) => setCurrentModule(prev => ({ ...prev, title: e.target.value }))}
                                        sx={{ mb: 1 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Module Description"
                                        multiline
                                        rows={2}
                                        value={currentModule.description}
                                        onChange={(e) => setCurrentModule(prev => ({ ...prev, description: e.target.value }))}
                                        sx={{ mb: 1 }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAddModule}
                                        startIcon={<AddIcon />}
                                        disabled={!currentModule.title || !currentModule.description}
                                    >
                                        Add Module
                                    </Button>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.title || !formData.description || !formData.thumbnail || formData.modules.length === 0}
                    >
                        {editingCourse ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {error && (
                <Typography
                    color="error"
                    sx={{
                        mt: 2,
                        whiteSpace: 'pre-line',
                        backgroundColor: '#fff3f3',
                        padding: 2,
                        borderRadius: 1
                    }}
                >
                    {error}
                </Typography>
            )}

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1.1rem',
                        padding: '12px 20px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        '& .MuiAlert-icon': {
                            fontSize: '1.5rem'
                        }
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Courses; 