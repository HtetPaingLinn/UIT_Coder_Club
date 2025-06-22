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
import { Library, Plus, Edit, Trash2, ExternalLink, Download, FileText, Video, BookOpen, X, Upload, Image as ImageIcon, Link as LinkIcon, File, Menu } from 'lucide-react';
import Image from "next/image";
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500'] });

export default function ResourcesPage() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    category: 'programming',
    url: '',
    author: '',
    tags: '',
    isPublic: true,
    difficulty: 'beginner'
  });
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

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

  // Fetch resources
  useEffect(() => {
    if (!showLoading) {
      fetchResources();
    }
  }, [showLoading]);

  const fetchResources = async () => {
    try {
      const resourcesRef = collection(db, 'resources');
      const q = query(resourcesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const resourcesList = [];
      querySnapshot.forEach(doc => {
        resourcesList.push({ id: doc.id, ...doc.data() });
      });
      setResources(resourcesList);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        // Update existing resource
        const updateData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          category: formData.category,
          url: formData.url,
          author: formData.author,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isPublic: formData.isPublic,
          difficulty: formData.difficulty,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'resources', editingResource.id), updateData);
        setEditingResource(null);
      } else {
        // Create new resource
        const newResource = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          category: formData.category,
          url: formData.url,
          author: formData.author,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isPublic: formData.isPublic,
          difficulty: formData.difficulty,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        };
        
        await addDoc(collection(db, 'resources'), newResource);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'document',
        category: 'programming',
        url: '',
        author: '',
        tags: '',
        isPublic: true,
        difficulty: 'beginner'
      });
      setShowForm(false);
      
      // Refresh resources list
      fetchResources();
      
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Failed to save resource. Please try again.');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'document',
      category: resource.category || 'programming',
      url: resource.url || '',
      author: resource.author || '',
      tags: resource.tags ? resource.tags.join(', ') : '',
      isPublic: resource.isPublic !== undefined ? resource.isPublic : true,
      difficulty: resource.difficulty || 'beginner'
    });
    setShowForm(true);
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteDoc(doc(db, 'resources', resourceId));
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Failed to delete resource. Please try again.');
      }
    }
  };

  const openForm = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'document',
      category: 'programming',
      url: '',
      author: '',
      tags: '',
      isPublic: true,
      difficulty: 'beginner'
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'programming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'web-development':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'data-science':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'mobile-development':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'cybersecurity':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'ai-ml':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'video':
        return Video;
      case 'link':
        return LinkIcon;
      case 'book':
        return BookOpen;
      case 'file':
        return File;
      default:
        return Library;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-teal-100 to-slate-100">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Resources Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Create and manage educational resources
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={openForm} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          </div>

          {/* Form Section */}
          {showForm && (
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-6 sm:mb-10">
              <div className="px-2 sm:px-6 flex items-center justify-between">
                <div className='pb-4'>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {editingResource ? 'Edit Resource' : 'Create New Resource'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {editingResource ? 'Update the resource details below' : 'Fill in the resource information'}
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
                      Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter resource title"
                      required
                      className="w-full h-11 text-base"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter resource description"
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Type and Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                        <option value="book">Book</option>
                        <option value="file">File</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="programming">Programming</option>
                        <option value="web-development">Web Development</option>
                        <option value="data-science">Data Science</option>
                        <option value="mobile-development">Mobile Development</option>
                        <option value="cybersecurity">Cybersecurity</option>
                        <option value="ai-ml">AI/ML</option>
                      </select>
                    </div>
                  </div>

                  {/* Difficulty and Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty *
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Author
                      </label>
                      <Input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Enter author name"
                        className="w-full h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Tags and URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                      </label>
                      <Input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="e.g., javascript, react, tutorial"
                        className="w-full h-11 text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        URL
                      </label>
                      <Input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Public Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                      Make this resource public
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 py-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <Button type="submit" className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-base">
                      {editingResource ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Resource
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Resource
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

          {/* Resources Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource) => {
              const TypeIcon = getTypeIcon(resource.type);
              return (
                <Card key={resource.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col">
                  <CardHeader className="px-4 sm:px-6 pb-3 pt-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg`}>
                        <TypeIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(resource)}
                          className="text-blue-600 hover:text-blue-700 p-1 sm:p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                          className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mt-3">
                      {resource.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {resource.description}
                    </p>
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Category:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                          {resource.category.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                          {resource.difficulty}
                        </span>
                      </div>
                      
                      {resource.author && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Author:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-24">
                            {resource.author}
                          </span>
                        </div>
                      )}
                      
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              {tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              +{resource.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {resource.url && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(resource.url, '_blank')}
                          className="w-full text-xs h-9"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Resource
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {resources.length === 0 && !showForm && (
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <Library className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">No resources yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">Get started by adding your first educational resource.</p>
                <Button onClick={openForm} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
} 