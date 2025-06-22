'use client'
import React from "react"
import { auth, db } from "@/firebase"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { sendEmailVerification } from "firebase/auth";
import { useState, useEffect, useContext } from "react"

const AuthContext = React.createContext()
export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [ currentUser, setCurrentUser ] = useState(null);
    const [ userDataObj, setUserDataObj ] = useState(null);
    const [ loading, setLoading ] = useState(true); // Initialize true for initial auth check

    // Handle browser close/unload events
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Optional: You can add additional cleanup here
                console.log('Page hidden - user may be closing browser');
            }
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup event listeners
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Function to create activity log
    const createActivity = async (type, description, details = {}) => {
        try {
            const activityData = {
                type,
                description,
                details,
                timestamp: serverTimestamp(),
                createdBy: 'system'
            };
            
            await addDoc(collection(db, 'activities'), activityData);
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    };

    // Function to check network connectivity
    const checkNetworkConnectivity = async () => {
        try {
            // Try to fetch a simple resource to test connectivity
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            console.error('Network connectivity check failed:', error);
            return false;
        }
    };

    // Auth Handlers
    async function signup(email, password) {
        // ... (your existing signup logic, no changes needed here)
        const requiredDomain = "@uit.edu.mm";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        let errorMessage = "";

        if (!email.endsWith(requiredDomain)) {
            errorMessage = "Email must end with uit.edu.mm";
            console.error("Signup Error:", errorMessage);
            return { success: false, message: errorMessage };
        }
        if (!passwordRegex.test(password)) {
            errorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one symbol.";
            console.error("Signup Error:", errorMessage);
            return { success: false, message: errorMessage };
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);
            console.log("Signup successful. Verification email sent.");

            // Create initial user document in Firestore on signup
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                createdAt: new Date(),
                name: '',
                studentId: '',
                major: '',
                enrolledEvent: '',
                status: '',
                role: '' 
            }, { merge: true });

            // Create activity log for new student registration
            await createActivity(
                'student_registration',
                `New student registration: ${email}`,
                { email: email, userId: user.uid }
            );

            return {
                success: true,
                message: "Verification email sent. Please check your inbox and verify before logging in.",
            };
        } catch (error) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email address is already registered. Please use a different email or log in.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "The email address is not valid. Please check the format.";
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "Email/password accounts are not enabled. Please contact support.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "The password is too weak. Please choose a stronger password.";
                    break;
                default:
                    console.error("Firebase Auth Error:", error.code, error.message);
                    errorMessage = "Signup failed. Please try again later.";
            }
            console.error("Signup Error:", errorMessage);
            return { success: false, message: errorMessage };
        }
    }

    async function login(email, password) {
        try {
            // Check network connectivity first
            const isNetworkAvailable = await checkNetworkConnectivity();
            if (!isNetworkAvailable) {
                return {
                    success: false,
                    message: "No internet connection detected. Please check your network connection and try again.",
                };
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await sendEmailVerification(user);
            
                return {
                    success: false,
                    message: "Please verify your email address to continue. A new verification email has been sent.",
                };
            }

            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();

                if (!userData.role || userData.role.trim() === "") {
                    console.warn("Role is empty or missing. Redirecting to setup.");
                    // Return success with redirect info instead of using window.location.href
                    return { success: true, redirectTo: "/setup" };
                } else {
                    // Role is set; return success with dashboard redirect
                    return { success: true, redirectTo: "/dashboard" };
                }
            } else {
                throw new Error("User data not found in Firestore.");
            }
        } catch (error) {
            let errorMessage = "An unknown error occurred. Please try again.";
            
            // Log detailed error information for debugging
            console.error("Login Error Details:", {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email. Please check your email or register.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Invalid email format. Please enter a valid email address.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many failed login attempts. Please try again later.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network connection failed. Please check your internet connection and try again.";
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "Email/password sign-in is not enabled. Please contact support.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled. Please contact support.";
                    break;
                case 'auth/invalid-credential':
                    errorMessage = "Invalid credentials. Please check your email and password.";
                    break;
                default:
                    console.error("Firebase Auth Error:", error.code, error.message);
                    // Check if it's a network-related error even if not specifically "auth/network-request-failed"
                    if (error.message && error.message.toLowerCase().includes('network')) {
                        errorMessage = "Network connection failed. Please check your internet connection and try again.";
                    } else {
                        errorMessage = "Login failed. Please check your credentials and try again.";
                    }
            }
            console.error("Login Error:", errorMessage);
            return { success: false, message: errorMessage };
        }
    }

    async function logout(){
        try {
            // Clear local state first to prevent Firestore access attempts
            setUserDataObj(null)
            setCurrentUser(null)
            
            // Clear session storage
            sessionStorage.clear();
            // Only clear auth-related localStorage items, not everything
            localStorage.removeItem('firebase:authUser:');
            
            // Sign out from Firebase
            await signOut(auth)
            
            // Redirect to login page after successful logout
            window.location.href = '/Login'
        } catch (error) {
            console.error('Error during logout:', error)
            // Even if there's an error, clear local state and redirect
            setUserDataObj(null)
            setCurrentUser(null)
            window.location.href = '/Login'
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true); // Start loading
            if (user) {
                try {
                    await user.reload();
                    if (!user.emailVerified) {
                        console.warn("Email not verified.");
                        setCurrentUser(null);
                        setUserDataObj(null);
                    } else {
                        setCurrentUser(user);
                        // Only try to fetch user data if user is still authenticated
                        if (auth.currentUser) {
                            const docRef = doc(db, 'users', user.uid);
                            const docSnap = await getDoc(docRef);
                            if (docSnap.exists()) {
                                setUserDataObj(docSnap.data());
                            } else {
                                const defaultData = { email: user.email, createdAt: new Date() };
                                await setDoc(docRef, defaultData, { merge: true });
                                setUserDataObj(defaultData);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Don't set error state if it's a permission error during logout
                    if (error.code !== 'permission-denied') {
                        setCurrentUser(null);
                        setUserDataObj(null);
                    }
                }
            } else {
                setCurrentUser(null);
                setUserDataObj(null);
            }
            setLoading(false); // Stop loading after all async operations
        });

        return () => unsubscribe();
    }, []);

    const value = {
        currentUser,
        userDataObj,
        setUserDataObj,
        signup,
        logout,
        login,
        loading 
    }

    return (
        <AuthContext.Provider value={value}>
            { children }
        </AuthContext.Provider>
    )
}