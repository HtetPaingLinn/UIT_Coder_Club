'use client'
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';

export default function FirebaseDiagnostic() {
    const [diagnostics, setDiagnostics] = useState({
        firebaseConfig: false,
        networkConnectivity: false,
        authService: false,
        firestoreService: false,
        error: null
    });

    const runDiagnostics = async () => {
        const results = {
            firebaseConfig: false,
            networkConnectivity: false,
            authService: false,
            firestoreService: false,
            error: null
        };

        try {
            // Check Firebase configuration
            const config = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };

            const missingFields = Object.entries(config)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length === 0) {
                results.firebaseConfig = true;
            } else {
                results.error = `Missing Firebase config: ${missingFields.join(', ')}`;
            }

            // Check network connectivity
            try {
                await fetch('https://www.google.com/favicon.ico', {
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                results.networkConnectivity = true;
            } catch (error) {
                results.error = 'Network connectivity failed';
            }

            // Check Auth service
            if (auth) {
                try {
                    // Just check if auth object is properly initialized
                    results.authService = true;
                } catch (error) {
                    results.error = 'Auth service failed to initialize';
                }
            }

            // Check Firestore service
            if (db) {
                try {
                    // Just check if db object is properly initialized
                    results.firestoreService = true;
                } catch (error) {
                    results.error = 'Firestore service failed to initialize';
                }
            }

        } catch (error) {
            results.error = error.message;
        }

        setDiagnostics(results);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Firebase Diagnostic</h3>
            
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${diagnostics.firebaseConfig ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Firebase Configuration</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${diagnostics.networkConnectivity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Network Connectivity</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${diagnostics.authService ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Auth Service</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${diagnostics.firestoreService ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Firestore Service</span>
                </div>
            </div>

            {diagnostics.error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                    <strong>Error:</strong> {diagnostics.error}
                </div>
            )}

            <button 
                onClick={runDiagnostics}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Run Diagnostics Again
            </button>
        </div>
    );
} 