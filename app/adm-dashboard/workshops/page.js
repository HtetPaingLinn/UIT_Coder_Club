'use client';
import React, { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { DashboardNav } from '@/components/ui/dashboard-nav';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Edit, Trash2, Users, Clock, GraduationCap, X, Upload, Image as ImageIcon, Calendar, Star, Menu } from 'lucide-react';
import Image from "next/image";
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500'] });

export default function CoursesPage() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    level: 'beginner',
    maxStudents: '',
    price: '',
    imageUrl: '',
    category: 'programming',
    startDate: '',
    endDate: '',
    schedule: '',
    prerequisites: '',
    syllabus: ''
  });
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  // Function to create activity log
  const createActivity = async (type, description, details = {}) => {
    try {
      const activityData = {
        type,
        description,
        details,
        timestamp: serverTimestamp(),
        createdBy: currentUser?.uid || 'system'
      };
      
      await addDoc(collection(db, 'activities'), activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  // Image upload function
  const uploadImage = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      console.log('Uploading file:', file.name);

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      setUploadingImage(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'codingclub-uploads');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dxmqfapo7/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed with status: ${response.status}. Details: ${errorData}`);
      }

      const data = await response.json();
      
      console.log('Cloudinary response:', data);
      
      if (!data.secure_url) {
        throw new Error('No secure URL received from Cloudinary');
      }
      
      // Update form data with the uploaded image URL
      setFormData(prev => {
        const updated = { ...prev, imageUrl: data.secure_url };
        console.log('Updated formData with imageUrl:', updated);
        return updated;
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
  };

  // Check admin access
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push('/Login');
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.push('/setup');
          return;
        }

        const userData = userSnap.data();

        if (userData.role === 'student') {
          router.push('/user-dashboard');
          return;
        } else if (!['teacher', 'mentor', 'admin'].includes(userData.role)) {
          router.push('/setup');
          return;
        }

        setShowLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/user-dashboard');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch courses
  useEffect(() => {
    if (!showLoading) {
      fetchCourses();
    }
  }, [showLoading]);

  const fetchCourses = async () => {
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const coursesList = [];
      querySnapshot.forEach(doc => {
        coursesList.push({ id: doc.id, ...doc.data() });
      });
      setCourses(coursesList);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      
      if (editingCourse) {
        // Update existing course
        const updateData = {
          title: formData.title,
          description: formData.description,
          instructor: formData.instructor,
          duration: formData.duration,
          level: formData.level,
          maxStudents: parseInt(formData.maxStudents),
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          imageUrl: formData.imageUrl,
          startDate: formData.startDate,
          endDate: formData.endDate,
          schedule: formData.schedule,
          prerequisites: formData.prerequisites,
          syllabus: formData.syllabus,
          updatedAt: serverTimestamp()
        };
        
        console.log('Updating course with data:', updateData);
        await updateDoc(doc(db, 'courses', editingCourse.id), updateData);
        
        // Create activity log for workshop update
        await createActivity(
          'workshop_created',
          `Workshop "${formData.title}" was updated`,
          { workshopId: editingCourse.id, title: formData.title, instructor: formData.instructor }
        );
      } else {
        // Create new course
        const courseData = {
          ...formData,
          maxStudents: parseInt(formData.maxStudents),
          price: parseFloat(formData.price) || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: currentUser.uid
        };
        
        console.log('Creating new course with data:', courseData);
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        
        // Create activity log for new workshop
        await createActivity(
          'workshop_created',
          `New workshop "${formData.title}" was created`,
          { workshopId: docRef.id, title: formData.title, instructor: formData.instructor }
        );
      }

      setShowForm(false);
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        instructor: '',
        duration: '',
        level: 'beginner',
        maxStudents: '',
        price: '',
        imageUrl: '',
        category: 'programming',
        startDate: '',
        endDate: '',
        schedule: '',
        prerequisites: '',
        syllabus: ''
      });
      setImagePreview(null);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      duration: course.duration,
      level: course.level || 'beginner',
      maxStudents: course.maxStudents?.toString() || '',
      price: course.price?.toString() || '',
      imageUrl: course.imageUrl || '',
      category: course.category || 'programming',
      startDate: course.startDate || '',
      endDate: course.endDate || '',
      schedule: course.schedule || '',
      prerequisites: course.prerequisites || '',
      syllabus: course.syllabus || ''
    });
    setImagePreview(course.imageUrl || null);
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const openForm = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      instructor: '',
      duration: '',
      level: 'beginner',
      maxStudents: '',
      price: '',
      imageUrl: '',
      category: 'programming',
      startDate: '',
      endDate: '',
      schedule: '',
      prerequisites: '',
      syllabus: ''
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      instructor: '',
      duration: '',
      level: 'beginner',
      maxStudents: '',
      price: '',
      imageUrl: '',
      category: 'programming',
      startDate: '',
      endDate: '',
      schedule: '',
      prerequisites: '',
      syllabus: ''
    });
    setImagePreview(null);
  };

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-teal-100 to-slate-100">
        <Loading />
      </div>
    );
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'programming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'web-development': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'data-science': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'mobile-development': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'cybersecurity': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'ai-ml': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Date validation functions
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinEndDate = () => {
    return formData.startDate || getTodayString();
  };

  const handleStartDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData({...formData, startDate: selectedDate});
    
    // If end date is before the new start date, clear it
    if (formData.endDate && formData.endDate < selectedDate) {
      setFormData(prev => ({...prev, endDate: ''}));
    }
  };

  const handleEndDateChange = (e) => {
    setFormData({...formData, endDate: e.target.value});
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto">
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg">
                  <Image src={'/uit_logo.png'} width={40} height={40} alt={'uit_logo'} />
                </div>
                <div>
                  <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white mt-1`}>UIT Coding Club</h1>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>
            <DashboardNav />
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-700/50 space-x-2">
            <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg">
              <Image src={'/uit_logo.png'} width={40} height={40} alt={'uit_logo'} />
            </div>
            <div>
              <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white mt-1`}>UIT Coding Club</h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-w-[44px] min-h-[44px]"
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg flex-shrink-0">
                <Image src={'/uit_logo.png'} width={32} height={32} alt={'uit_logo'} />
              </div>
              <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white truncate`}>UIT Coding Club</h1>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <DashboardHeader />
        </div>
        
        <main className="flex-1 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Workshops</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Create and manage educational workshops
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={openForm} className="bg-[#047d8a] hover:bg-[#036570] text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Workshop
              </Button>
            </div>
          </div>

          {/* Form Section */}
          {showForm && (
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-6 sm:mb-10">
              <div className="px-2 sm:px-6 flex items-center justify-between">
                <div className='pb-4'>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {editingCourse ? 'Edit Workshop' : 'Create New Workshop'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {editingCourse ? 'Update the workshop details below' : 'Fill in the workshop information'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <CardContent className="px-2 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Workshop Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      className="w-full h-11 text-base"
                      placeholder="Enter workshop title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your workshop..."
                    />
                  </div>

                  {/* Instructor and Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Instructor *
                      </label>
                      <Input
                        type="text"
                        value={formData.instructor}
                        onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                        required
                        className="w-full h-11 text-base"
                        placeholder="Enter instructor name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Duration *
                      </label>
                      <Input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        required
                        className="w-full h-11 text-base"
                        placeholder="e.g., 8 weeks, 3 months"
                      />
                    </div>
                  </div>

                  {/* Level and Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Level *
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="programming">Programming</option>
                        <option value="web-development">Web Development</option>
                        <option value="data-science">Data Science</option>
                        <option value="mobile-development">Mobile Development</option>
                        <option value="cybersecurity">Cybersecurity</option>
                        <option value="ai-ml">AI & Machine Learning</option>
                      </select>
                    </div>
                  </div>

                  {/* Max Students and Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Max Students *
                      </label>
                      <Input
                        type="number"
                        value={formData.maxStudents}
                        onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                        required
                        min="1"
                        className="w-full h-11 text-base"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Price (USD)
                      </label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        min="0"
                        step="0.01"
                        className="w-full h-11 text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Start Date and End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={handleStartDateChange}
                        min={getTodayString()}
                        className="w-full h-11 text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={handleEndDateChange}
                        min={getMinEndDate()}
                        className="w-full h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Schedule
                    </label>
                    <Input
                      type="text"
                      value={formData.schedule}
                      onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                      className="w-full h-11 text-base"
                      placeholder="e.g., Mondays and Wednesdays 6-8 PM"
                    />
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Prerequisites
                    </label>
                    <textarea
                      value={formData.prerequisites}
                      onChange={(e) => setFormData({...formData, prerequisites: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List any prerequisites for this workshop..."
                    />
                  </div>

                  {/* Course Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Workshop Image
                    </label>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.imageUrl) && (
                      <div className="mb-4">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <Image
                            src={imagePreview || formData.imageUrl}
                            alt="Course preview"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeImage}
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <label className="cursor-pointer flex flex-col items-center space-y-2">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {uploadingImage ? 'Uploading...' : (imagePreview || formData.imageUrl) ? 'Change Image' : 'Upload Workshop Image'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={uploadImage}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploadingImage && (
                      <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        Uploading image...
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 py-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <Button
                      type="submit"
                      className="flex-1 h-11 bg-[#047d8a] hover:bg-[#036570] text-white font-medium text-base"
                    >
                      {editingCourse ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Workshop
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Workshop
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeForm}
                      className="flex-1 h-11 font-medium text-base"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Courses Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                {/* Course Image */}
                {course.imageUrl && (
                  <div className="relative h-40">
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardHeader className={`px-6 pb-3 ${course.imageUrl ? 'pt-4' : 'pt-6'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {course.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                          {course.category}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex-grow flex flex-col">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="space-y-2 mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {course.instructor}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {course.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-2" />
                      Max: {course.maxStudents} students
                    </div>
                    {course.price > 0 && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Star className="h-4 w-4 mr-2" />
                        ${course.price}
                      </div>
                    )}
                    {course.startDate && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(course.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {courses.length === 0 && !showForm && (
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No workshops yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first workshop to get started</p>
                <Button onClick={openForm} className="bg-[#047d8a] hover:bg-[#036570] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workshop
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
} 