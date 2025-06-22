'use client';
import React, { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DashboardNav } from '@/components/ui/dashboard-nav';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Edit, Trash2, Users, MapPin, Clock, CalendarDays, X, Upload, Image as ImageIcon, AlertCircle, Database, Menu } from 'lucide-react';
import Image from "next/image";
import { Montserrat } from 'next/font/google';
import { createSampleEvents, createSampleEventsWithImages } from '@/firebase/utils';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500'] });

export default function EventsPage() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    imageUrl: '',
    category: 'competition'
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  // Function to check if current time is after 2pm
  const isAfter2PM = () => {
    const now = new Date();
    return now.getHours() >= 14; // 2pm = 14:00
  };

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Function to get minimum allowed date
  const getMinDate = () => {
    if (isAfter2PM()) {
      // If after 2pm, minimum date is tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    } else {
      // If before 2pm, minimum date is today
      return getTodayDate();
    }
  };

  // Function to validate location (only numbers like 213, 231, 313)
  const validateLocation = (location) => {
    if (!location) return true; // Allow empty for initial state
    const numberPattern = /^\d{3}$/; // Exactly 3 digits
    return numberPattern.test(location);
  };

  // Function to validate time (between 08:30 and 15:00)
  const validateTime = (time) => {
    if (!time) return true;
    // time is in HH:MM format
    const [hour, minute] = time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;
    const minMinutes = 8 * 60 + 30; // 08:30
    const maxMinutes = 15 * 60;     // 15:00
    return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
  };

  // Function to validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate date
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() === today.getTime() && isAfter2PM()) {
        newErrors.date = "Today's date cannot be used after 2:00 PM. Please select tomorrow or a later date.";
      }
    }

    // Validate location
    if (formData.location && !validateLocation(formData.location)) {
      newErrors.location = "Location must be a 3-digit number (e.g., 213, 231, 313)";
    }

    // Validate time
    if (formData.time && !validateTime(formData.time)) {
      newErrors.time = "Time must be between 08:30 and 15:00.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form data changes with validation
  const handleFormChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation for location
    if (field === 'location') {
      if (value && !validateLocation(value)) {
        setErrors(prev => ({ ...prev, location: "Location must be a 3-digit number (e.g., 213, 231, 313)" }));
      } else if (value && validateLocation(value)) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    }

    // Real-time validation for date
    if (field === 'date' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() === today.getTime() && isAfter2PM()) {
        setErrors(prev => ({ ...prev, date: "Today's date cannot be used after 2:00 PM. Please select tomorrow or a later date." }));
      } else {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }

    // Real-time validation for time
    if (field === 'time') {
      if (value && !validateTime(value)) {
        setErrors(prev => ({ ...prev, time: "Time must be between 08:30 and 15:00." }));
      } else {
        setErrors(prev => ({ ...prev, time: '' }));
      }
    }
  };

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

      console.log('Uploading file:', file.name); // Debug log

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      setUploadingImage(true);

      // Get Cloudinary configuration from environment variables
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxmqfapo7';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'codingclub-uploads';

      console.log('Using Cloudinary config:', { cloudName, uploadPreset }); // Debug log

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Cloudinary response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Cloudinary error response:', errorData); // Debug log
        
        // Try to parse error as JSON for better error messages
        try {
          const errorJson = JSON.parse(errorData);
          throw new Error(`Upload failed: ${errorJson.error?.message || errorJson.error || 'Unknown error'}`);
        } catch {
          throw new Error(`Upload failed with status: ${response.status}. Please check your Cloudinary configuration.`);
        }
      }

      const data = await response.json();
      
      console.log('Cloudinary response:', data); // Debug log
      
      if (!data.secure_url) {
        throw new Error('No secure URL received from Cloudinary');
      }
      
      // Update form data with the uploaded image URL
      setFormData(prev => {
        const updated = { ...prev, imageUrl: data.secure_url };
        console.log('Updated formData with imageUrl:', updated); // Debug log
        return updated;
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.message.includes('File size')) {
        errorMessage = error.message;
      } else if (error.message.includes('valid image file')) {
        errorMessage = error.message;
      } else if (error.message.includes('Upload failed:')) {
        errorMessage = error.message;
      } else if (error.message.includes('Cloudinary configuration')) {
        errorMessage = 'Image upload service is not properly configured. Please contact the administrator.';
      }
      
      alert(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  // Alternative Firebase Storage upload function (uncomment to use instead of Cloudinary)
  /*
  const uploadImageToFirebase = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      console.log('Uploading file to Firebase:', file.name);

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      setUploadingImage(true);

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `events/${timestamp}_${file.name}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Firebase upload successful:', downloadURL);
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: downloadURL
      }));
      
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };
  */

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

  // Fetch events
  useEffect(() => {
    if (!showLoading) {
      fetchEvents();
    }
  }, [showLoading]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const eventsList = [];
      querySnapshot.forEach(doc => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }
    
    try {
      console.log('Submitting form data:', formData); // Debug log
      
      if (editingEvent) {
        // Update existing event
        const updateData = {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          maxParticipants: parseInt(formData.maxParticipants),
          category: formData.category,
          imageUrl: formData.imageUrl,
          updatedAt: serverTimestamp()
        };
        
        console.log('Updating event with data:', updateData); // Debug log
        await updateDoc(doc(db, 'events', editingEvent.id), updateData);
        
        // Create activity log for event update
        await createActivity(
          'event_scheduled',
          `Event "${formData.title}" was updated`,
          { eventId: editingEvent.id, title: formData.title, date: formData.date, location: formData.location }
        );
      } else {
        // Create new event
        const eventData = {
          ...formData,
          maxParticipants: parseInt(formData.maxParticipants),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: currentUser.uid
        };
        
        console.log('Creating new event with data:', eventData); // Debug log
        const docRef = await addDoc(collection(db, 'events'), eventData);
        
        // Create activity log for new event
        await createActivity(
          'event_scheduled',
          `New event "${formData.title}" was scheduled`,
          { eventId: docRef.id, title: formData.title, date: formData.date, location: formData.location }
        );
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxParticipants: '',
        imageUrl: '',
        category: 'competition'
      });
      setImagePreview(null);
      setErrors({}); // Clear errors
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      maxParticipants: event.maxParticipants.toString(),
      imageUrl: event.imageUrl || '',
      category: event.category || 'workshop'
    });
    setImagePreview(event.imageUrl || null);
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const openForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: '',
      imageUrl: '',
      category: 'competition'
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: '',
      imageUrl: '',
      category: 'competition'
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
      case 'workshop': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'competition': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'seminar': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'hackathon': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50">
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
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2 min-w-0">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Events Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Create and manage club events
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={openForm} className="bg-[#047d8a] hover:bg-[#036570] text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Form Section */}
          {showForm && (
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-6 sm:mb-10">
              <div className="px-2 sm:px-6 flex items-center justify-between">
                <div className='pb-4'>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {editingEvent ? 'Update the event details below' : 'Fill in the event information'}
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
                      Event Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      required
                      className="w-full h-11 text-base"
                      placeholder="Enter event title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your event..."
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleFormChange('date', e.target.value)}
                        required
                        min={getMinDate()}
                        className="w-full h-11 text-base"
                      />
                      {errors.date ? (
                        <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {errors.date}
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Time *
                      </label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleFormChange('time', e.target.value)}
                        required
                        min="08:30"
                        max="15:00"
                        className="w-full h-11 text-base"
                      />
                      {errors.time ? (
                        <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {errors.time}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location *
                    </label>
                    <Input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      required
                      className="w-full h-11 text-base"
                      placeholder="Enter event location (e.g., 213)"
                    />
                    {errors.location ? (
                      <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {errors.location}
                      </div>
                    ) : null}
                  </div>

                  {/* Max Participants and Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Max Participants *
                      </label>
                      <Input
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => handleFormChange('maxParticipants', e.target.value)}
                        required
                        min="1"
                        className="w-full h-11 text-base"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleFormChange('category', e.target.value)}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="competition">Competition</option>
                        <option value="seminar">Seminar</option>
                        <option value="hackathon">Hackathon</option>
                      </select>
                    </div>
                  </div>

                  {/* Event Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Event Image
                    </label>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.imageUrl) && (
                      <div className="mb-4">
                        <div className="relative w-full h-32 sm:h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <Image
                            src={imagePreview || formData.imageUrl}
                            alt="Event preview"
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
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <label className="cursor-pointer flex flex-col items-center space-y-2">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {uploadingImage ? 'Uploading...' : (imagePreview || formData.imageUrl) ? 'Change Image' : 'Upload Event Image'}
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
                    <Button type="submit" className="flex-1 h-11 bg-[#047d8a] hover:bg-[#036570] text-white font-medium text-base">
                      {editingEvent ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Event
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeForm} className="flex-1 h-11 font-medium text-base">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Events Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="relative h-32 sm:h-40">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardHeader className={`px-4 sm:px-6 pb-3 ${event.imageUrl ? 'pt-4' : 'pt-6'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="text-blue-600 hover:text-blue-700 p-1 sm:p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6 flex-grow flex flex-col">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate text-xs">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate text-xs">{event.time}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate text-xs">{event.location}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate text-xs">Max: {event.maxParticipants} participants</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {events.length === 0 && !showForm && (
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">No events yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">Create your first event to get started</p>
                <Button onClick={openForm} className="bg-[#047d8a] hover:bg-[#036570] text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
} 