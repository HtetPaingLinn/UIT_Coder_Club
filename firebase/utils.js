import { doc, updateDoc, setDoc, getDoc, collection, getDocs, query, orderBy, where, addDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase';

// Update user profile in Firestore
export const updateUserProfile = async (userId, updateData) => {
    try {
        const userRef = doc(db, 'users', userId);
        
        // Check if document exists
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            // Update existing document
            await updateDoc(userRef, updateData);
        } else {
            // Create new document
            await setDoc(userRef, {
                ...updateData,
                createdAt: new Date().toISOString()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        }
        
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

// Get all events from Firestore
export const getAllEvents = async () => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const events = [];
        querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            // Convert Firestore Timestamp to Date if needed
            if (eventData.date && typeof eventData.date.toDate === 'function') {
                eventData.date = eventData.date.toDate();
            }
            events.push({
                id: doc.id,
                ...eventData
            });
        });
        
        return events;
    } catch (error) {
        console.error('Error getting events:', error);
        return [];
    }
};

// Get events for a specific date
export const getEventsByDate = async (date) => {
    try {
        const eventsRef = collection(db, 'events');
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const q = query(
            eventsRef,
            where('date', '>=', startOfDay),
            where('date', '<=', endOfDay),
            orderBy('date', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        
        const events = [];
        querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            // Convert Firestore Timestamp to Date if needed
            if (eventData.date && typeof eventData.date.toDate === 'function') {
                eventData.date = eventData.date.toDate();
            }
            events.push({
                id: doc.id,
                ...eventData
            });
        });
        
        return events;
    } catch (error) {
        console.error('Error getting events by date:', error);
        return [];
    }
};

// Add a new event to Firestore
export const addEvent = async (eventData) => {
    try {
        const eventsRef = collection(db, 'events');
        const docRef = await addDoc(eventsRef, {
            ...eventData,
            createdAt: new Date().toISOString()
        });
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding event:', error);
        return null;
    }
};

// Create sample events for testing
export const createSampleEvents = async () => {
    const sampleEvents = [
        {
            title: "Coding Workshop: Introduction to React",
            shortDescription: "Learn the basics of React.js and build your first component",
            fullDescription: "Join us for an interactive workshop where you'll learn the fundamentals of React.js. We'll cover components, props, state, and build a simple application together. Perfect for beginners!",
            date: new Date(2025, 5, 20), // June 20, 2025
            time: "2:00 PM - 4:00 PM",
            location: "Computer Lab 101",
            type: "Workshop",
            maxParticipants: 30,
            currentParticipants: 15,
            imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Hackathon: Build Something Amazing",
            shortDescription: "24-hour coding challenge to build innovative solutions",
            fullDescription: "A 24-hour hackathon where teams will work together to build innovative solutions to real-world problems. Food and drinks provided. Prizes for the best projects!",
            date: new Date(2025, 5, 25), // June 25, 2025
            time: "9:00 AM - 9:00 AM (Next Day)",
            location: "Main Campus Hall",
            type: "Hackathon",
            maxParticipants: 100,
            currentParticipants: 45,
            imageUrl: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Web Development Bootcamp Day 1",
            shortDescription: "Intensive web development training session",
            fullDescription: "Day 1 of our intensive web development bootcamp. Learn HTML, CSS, and JavaScript fundamentals. Hands-on coding exercises included.",
            date: new Date(2025, 5, 26), // June 26, 2025
            time: "10:00 AM - 4:00 PM",
            location: "Computer Lab 102",
            type: "Bootcamp",
            maxParticipants: 25,
            currentParticipants: 18,
            imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Web Development Bootcamp Day 2",
            shortDescription: "Advanced web development concepts",
            fullDescription: "Day 2 of our web development bootcamp. Dive deeper into JavaScript, DOM manipulation, and responsive design principles.",
            date: new Date(2025, 5, 27), // June 27, 2025
            time: "10:00 AM - 4:00 PM",
            location: "Computer Lab 102",
            type: "Bootcamp",
            maxParticipants: 25,
            currentParticipants: 20,
            imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Guest Speaker: AI in Modern Development",
            shortDescription: "Industry expert shares insights on AI integration in software development",
            fullDescription: "Join us for an enlightening talk by Dr. Sarah Chen, Senior AI Engineer at TechCorp, as she discusses the latest trends in AI integration for modern software development.",
            date: new Date(2025, 5, 28), // June 28, 2025
            time: "6:00 PM - 7:30 PM",
            location: "Auditorium A",
            type: "Lecture",
            maxParticipants: 200,
            currentParticipants: 120,
            imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Code Review Session",
            shortDescription: "Peer code review and best practices discussion",
            fullDescription: "Bring your code and get feedback from peers and mentors. We'll discuss best practices, code quality, and optimization techniques.",
            date: new Date(2025, 6, 2), // July 2, 2025
            time: "3:00 PM - 5:00 PM",
            location: "Study Room 3",
            type: "Discussion",
            maxParticipants: 20,
            currentParticipants: 8
            // No imageUrl for this event to show fallback design
        }
    ];

    try {
        for (const event of sampleEvents) {
            await addEvent(event);
        }
        console.log('Sample events created successfully');
        return true;
    } catch (error) {
        console.error('Error creating sample events:', error);
        return false;
    }
};

// Create sample events with images for testing (call this from admin dashboard)
export const createSampleEventsWithImages = async () => {
    const sampleEventsWithImages = [
        {
            title: "React Workshop: Advanced Concepts",
            shortDescription: "Master advanced React patterns and state management",
            fullDescription: "Take your React skills to the next level with advanced concepts like Context API, Custom Hooks, and Performance Optimization.",
            date: new Date(2025, 6, 10), // July 10, 2025
            time: "1:00 PM - 4:00 PM",
            location: "213",
            category: "workshop",
            maxParticipants: 25,
            imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "Annual Coding Competition",
            shortDescription: "Showcase your programming skills in our annual competition",
            fullDescription: "Compete with fellow students in our annual coding competition. Solve challenging problems and win exciting prizes!",
            date: new Date(2025, 6, 15), // July 15, 2025
            time: "9:00 AM - 5:00 PM",
            location: "231",
            category: "competition",
            maxParticipants: 50,
            imageUrl: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=800&auto=format&fit=crop"
        },
        {
            title: "AI & Machine Learning Seminar",
            shortDescription: "Introduction to AI and ML concepts for beginners",
            fullDescription: "Learn the fundamentals of Artificial Intelligence and Machine Learning in this comprehensive seminar.",
            date: new Date(2025, 6, 20), // July 20, 2025
            time: "2:00 PM - 4:00 PM",
            location: "313",
            category: "seminar",
            maxParticipants: 40,
            imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop"
        }
    ];

    try {
        for (const event of sampleEventsWithImages) {
            await addEvent(event);
        }
        console.log('Sample events with images created successfully');
        return true;
    } catch (error) {
        console.error('Error creating sample events with images:', error);
        return false;
    }
};

// Register user for an event
export const registerForEvent = async (userId, eventId, eventData) => {
    try {
        // Check if user is already registered for this event
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const registeredEvents = userData.registeredEvents || [];
        
        if (registeredEvents.includes(eventId)) {
            throw new Error('User is already registered for this event');
        }
        
        // Check if event is full
        if (eventData.currentParticipants >= eventData.maxParticipants) {
            throw new Error('Event is full');
        }
        
        // Add event to user's registered events
        await updateDoc(userRef, {
            registeredEvents: [...registeredEvents, eventId]
        });
        
        // Update event participant count
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
            currentParticipants: increment(1)
        });
        
        // Create registration record
        const registrationRef = collection(db, 'eventRegistrations');
        await addDoc(registrationRef, {
            userId: userId,
            eventId: eventId,
            eventTitle: eventData.title,
            registrationDate: new Date().toISOString(),
            userEmail: userData.email,
            userName: userData.name || 'Unknown'
        });
        
        return {
            success: true,
            message: 'Successfully registered for event'
        };
    } catch (error) {
        console.error('Error registering for event:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Get user's registered events
export const getUserRegisteredEvents = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return [];
        }
        
        const userData = userDoc.data();
        const registeredEventIds = userData.registeredEvents || [];
        
        if (registeredEventIds.length === 0) {
            return [];
        }
        
        // Get event details for registered events
        const events = [];
        for (const eventId of registeredEventIds) {
            const eventRef = doc(db, 'events', eventId);
            const eventDoc = await getDoc(eventRef);
            
            if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                // Convert Firestore Timestamp to Date if needed
                if (eventData.date && typeof eventData.date.toDate === 'function') {
                    eventData.date = eventData.date.toDate();
                }
                events.push({
                    id: eventDoc.id,
                    ...eventData
                });
            }
        }
        
        return events;
    } catch (error) {
        console.error('Error getting user registered events:', error);
        return [];
    }
};

// Check if user is registered for an event
export const isUserRegisteredForEvent = async (userId, eventId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return false;
        }
        
        const userData = userDoc.data();
        const registeredEvents = userData.registeredEvents || [];
        
        return registeredEvents.includes(eventId);
    } catch (error) {
        console.error('Error checking event registration:', error);
        return false;
    }
};

// Get all workshops from Firestore
export const getAllWorkshops = async () => {
    try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const workshops = [];
        querySnapshot.forEach((doc) => {
            const workshopData = doc.data();
            // Convert Firestore Timestamp to Date if needed
            if (workshopData.startDate && typeof workshopData.startDate.toDate === 'function') {
                workshopData.startDate = workshopData.startDate.toDate();
            }
            if (workshopData.endDate && typeof workshopData.endDate.toDate === 'function') {
                workshopData.endDate = workshopData.endDate.toDate();
            }
            workshops.push({
                id: doc.id,
                ...workshopData
            });
        });
        
        return workshops;
    } catch (error) {
        console.error('Error getting workshops:', error);
        return [];
    }
}; 