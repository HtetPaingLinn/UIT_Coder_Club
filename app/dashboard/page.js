'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Main from "@/components/Main";

export default function DashboardPage() {
    const { currentUser, userDataObj, loading } = useAuth();
    const router = useRouter();
    const db = getFirestore();
    const [debug, setDebug] = useState('');
    const hasCheckedRole = useRef(false);

    useEffect(() => {
        const checkUserRole = async () => {
            // Prevent multiple executions
            if (hasCheckedRole.current) {
                return;
            }

            try {
                // Add debug logging
                setDebug(prev => prev + '\nChecking user role...');
                
                if (!currentUser) {
                    setDebug(prev => prev + '\nNo current user, redirecting to login');
                    hasCheckedRole.current = true;
                    router.push('/Login');
                    return;
                }

                setDebug(prev => prev + `\nCurrent user: ${currentUser.email}`);
                
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setDebug(prev => prev + '\nNo user data found, redirecting to setup');
                    hasCheckedRole.current = true;
                    router.push('/setup');
                    return;
                }

                const userData = userSnap.data();
                setDebug(prev => prev + `\nUser role: ${userData.role}`);

                // Check if setup is completed
                if (!userData.role) {
                    setDebug(prev => prev + '\nNo role found, redirecting to setup');
                    hasCheckedRole.current = true;
                    router.push('/setup');
                    return;
                }

                // Redirect based on role
                switch(userData.role) {
                    case 'student':
                        setDebug(prev => prev + '\nRedirecting to user dashboard');
                        hasCheckedRole.current = true;
                        router.push('/user-dashboard');
                        break;
                    case 'teacher':
                    case 'mentor':
                    case 'admin':
                        setDebug(prev => prev + '\nRedirecting to admin dashboard');
                        hasCheckedRole.current = true;
                        router.push('/adm-dashboard');
                        break;
                    default:
                        setDebug(prev => prev + '\nInvalid role, redirecting to setup');
                        hasCheckedRole.current = true;
                        router.push('/setup');
                }
            } catch (error) {
                console.error('Error checking user role:', error);
                setDebug(prev => prev + `\nError: ${error.message}`);
                hasCheckedRole.current = true;
            }
        };

        if (!loading && currentUser && !hasCheckedRole.current) {
            checkUserRole();
        }
    }, [currentUser, loading]); // Removed router and db from dependencies

    // Return loading state with debug information
    return (
        <Main>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <pre className="mt-4 text-sm text-gray-600">
                    {debug}
                </pre>
            </div>
        </Main>
    );
}