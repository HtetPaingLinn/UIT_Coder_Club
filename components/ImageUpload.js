'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageUpload({ onImageUpload, onUploadStateChange }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const uploadImage = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Clear previous errors
            setError('');

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);

            setUploading(true);
            onUploadStateChange?.(true);

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
            
            // Pass the URL back to parent component
            onImageUpload(data.secure_url);
            
        } catch (error) {
            console.error('Error uploading image:', error);
            setError(error.message);
            
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
            
            setError(errorMessage);
        } finally {
            setUploading(false);
            onUploadStateChange?.(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <label className="cursor-pointer text-slate-950 px-4 py-2 rounded">
                {uploading ? 'Uploading...' : 'Upload Profile Picture'}
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={uploadImage}
                    disabled={uploading}
                />
            </label>
            {error && (
                <div className="text-red-500 text-sm text-center max-w-xs">
                    {error}
                </div>
            )}
        </div>
    );
} 