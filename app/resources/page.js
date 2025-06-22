'use client';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/firebase';

export default function Resources() {
    const [firebaseResources, setFirebaseResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch resources from Firebase
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);
                const resourcesRef = collection(db, 'resources');
                
                // Try with orderBy first, fallback to simple query if index doesn't exist
                try {
                    const q = query(
                        resourcesRef, 
                        where('isPublic', '==', true),
                        orderBy('createdAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const resourcesList = [];
                    querySnapshot.forEach(doc => {
                        resourcesList.push({ id: doc.id, ...doc.data() });
                    });
                    setFirebaseResources(resourcesList);
                } catch (indexError) {
                    console.warn('Index not found, fetching without ordering:', indexError);
                    // Fallback: fetch without orderBy
                    const q = query(resourcesRef, where('isPublic', '==', true));
                    const querySnapshot = await getDocs(q);
                    const resourcesList = [];
                    querySnapshot.forEach(doc => {
                        resourcesList.push({ id: doc.id, ...doc.data() });
                    });
                    // Sort manually in JavaScript
                    resourcesList.sort((a, b) => {
                        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
                        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
                        return dateB - dateA; // Newest first
                    });
                    setFirebaseResources(resourcesList);
                }
            } catch (error) {
                console.error('Error fetching resources:', error);
                setError('Failed to load resources. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    const learningResources = [
      {
        category: 'Web Development',
        resources: [
          {
            title: 'Next.js Documentation',
            description: 'Official documentation for Next.js framework',
            link: 'https://nextjs.org/docs',
            level: 'Beginner to Advanced'
          },
          {
            title: 'React Documentation',
            description: 'Learn React from the official documentation',
            link: 'https://react.dev',
            level: 'Beginner to Advanced'
          },
          {
            title: 'Tailwind CSS',
            description: 'Utility-first CSS framework documentation',
            link: 'https://tailwindcss.com/docs',
            level: 'Beginner to Advanced'
          }
        ]
      },
      {
        category: 'Programming Languages',
        resources: [
          {
            title: 'Python for Beginners',
            description: 'Comprehensive Python tutorial for beginners',
            link: 'https://www.python.org/about/gettingstarted/',
            level: 'Beginner'
          },
          {
            title: 'JavaScript.info',
            description: 'Modern JavaScript tutorial',
            link: 'https://javascript.info',
            level: 'Beginner to Advanced'
          }
        ]
      },
      {
        category: 'Data Structures & Algorithms',
        resources: [
          {
            title: 'LeetCode',
            description: 'Practice coding problems and prepare for interviews',
            link: 'https://leetcode.com',
            level: 'Intermediate to Advanced'
          },
          {
            title: 'GeeksforGeeks',
            description: 'Computer science portal for geeks',
            link: 'https://www.geeksforgeeks.org',
            level: 'All Levels'
          }
        ]
      }
    ];
  
    const tools = [
      {
        name: 'VS Code',
        description: 'Popular code editor with extensive extensions',
        link: 'https://code.visualstudio.com'
      },
      {
        name: 'Git',
        description: 'Version control system',
        link: 'https://git-scm.com'
      },
      {
        name: 'GitHub',
        description: 'Code hosting platform',
        link: 'https://github.com'
      }
    ];

    // Helper function to get category color
    const getCategoryColor = (category) => {
        const colors = {
            'programming': 'bg-blue-100 text-blue-800',
            'web-development': 'bg-green-100 text-green-800',
            'data-science': 'bg-purple-100 text-purple-800',
            'mobile-development': 'bg-orange-100 text-orange-800',
            'design': 'bg-pink-100 text-pink-800',
            'tools': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    // Helper function to get type icon
    const getTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return '🎥';
            case 'document':
                return '📄';
            case 'link':
                return '🔗';
            case 'file':
                return '📁';
            default:
                return '📚';
        }
    };

    // Helper function to get difficulty color
    const getDifficultyColor = (difficulty) => {
        const colors = {
            'beginner': 'bg-green-100 text-green-800',
            'intermediate': 'bg-yellow-100 text-yellow-800',
            'advanced': 'bg-red-100 text-red-800'
        };
        return colors[difficulty] || 'bg-gray-100 text-gray-800';
    };
  
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl">Resources</h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Learning materials and tools for developers
              </p>
            </div>
          </div>
        </section>
  
        {/* Learning Resources Section */}
        <section className="section bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="container">
            <h2 className="text-center mb-8 sm:mb-12 lg:mb-16 text-2xl sm:text-3xl lg:text-4xl">Learning Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {learningResources.map((category) => (
                <div key={category.category} className="card">
                  <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl">{category.category}</h3>
                  <div className="space-y-4 sm:space-y-6">
                    {category.resources.map((resource) => (
                      <div key={resource.title} className="border-b border-gray-200 pb-4 last:border-0">
                        <h4 className="mb-2 text-lg font-semibold">{resource.title}</h4>
                        <p className="text-gray-600 mb-3 text-sm sm:text-base">{resource.description}</p>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                          <span className="text-sm text-primary font-medium">{resource.level}</span>
                          <a 
                            href={resource.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark group inline-flex items-center text-sm sm:text-base font-medium"
                          >
                            Visit <span className="ml-1 text-primary transition-transform duration-200 group-hover:translate-x-2">→</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Tools Section */}
        <section className="section bg-gray-50 rounded-lg mx-4 sm:mx-6 lg:mx-8 my-12 sm:my-16 lg:my-20">
          <div className="container">
            <h2 className="text-center mt-12 sm:mt-16 lg:mt-20 mb-8 sm:mb-12 lg:mb-16 text-2xl sm:text-3xl lg:text-4xl">Essential Tools</h2>
            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {tools.map((tool) => (
                <div key={tool.name} className="card text-center">
                  <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl">{tool.name}</h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{tool.description}</p>
                  <a 
                    href={tool.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary inline-block w-full sm:w-auto"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Firebase Resources Section */}
        <section className="section bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="container">
            <h2 className="text-center mb-8 sm:mb-12 lg:mb-16 text-2xl sm:text-3xl lg:text-4xl">Club Resources</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">Loading resources...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && firebaseResources.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No resources available at the moment.</p>
              </div>
            )}

            {!loading && !error && firebaseResources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {firebaseResources.map((resource) => (
                  <div key={resource.id} className="card hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                        {resource.category}
                      </span>
                    </div>
                    
                    <h3 className="mb-3 text-xl font-semibold">{resource.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{resource.description}</p>
                    
                    {resource.author && (
                      <p className="text-sm text-gray-500 mb-3">By: {resource.author}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                        {resource.difficulty}
                      </span>
                      {resource.tags && resource.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark group inline-flex items-center text-sm font-medium"
                    >
                      {resource.type === 'video' ? 'Watch' : resource.type === 'document' ? 'Read' : 'Visit'} 
                      <span className="ml-1 text-primary transition-transform duration-200 group-hover:translate-x-2">→</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  } 