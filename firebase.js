// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    console.error('Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.');
    return false;
  }
  
  return true;
};

// Initialize Firebase only if configuration is valid
let app, auth, db, storage;

try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Set Firebase Auth to use session-only persistence
    // This ensures users are logged out when the browser session ends
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        console.log('Firebase Auth configured for session-only persistence');
      })
      .catch((error) => {
        console.error('Error setting Firebase Auth persistence:', error);
      });
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');
  } else {
    console.error('Firebase initialization failed due to missing configuration');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// const analytics = getAnalytics(app);

export { auth, db, storage };