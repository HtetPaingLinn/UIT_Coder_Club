# Cloudinary Setup Guide

## Issue
The image upload is failing because Cloudinary is not properly configured. The current code uses hardcoded credentials that may not be valid.

## Solution

### 1. Create a Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll get your Cloud Name from the dashboard

### 2. Create an Upload Preset
1. In your Cloudinary dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set the following:
   - **Preset name**: `codingclub-uploads` (or any name you prefer)
   - **Signing Mode**: `Unsigned`
   - **Folder**: `codingclub-events` (optional, for organization)
5. Save the preset

### 3. Set Environment Variables
Create a `.env.local` file in your project root with:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here
```

Replace:
- `your_cloud_name_here` with your actual Cloudinary cloud name
- `your_upload_preset_name_here` with your upload preset name (e.g., `codingclub-uploads`)

### 4. Restart Your Development Server
After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 5. Test the Upload
Try uploading an image again. You should now see more specific error messages in the browser console if there are still issues.

## Alternative: Use Firebase Storage
If you prefer to use Firebase Storage instead of Cloudinary, you can modify the upload function to use Firebase Storage. This would be more consistent with your existing Firebase setup.

## Debugging
If you still have issues:
1. Check the browser console for detailed error messages
2. Verify your Cloudinary credentials are correct
3. Make sure your upload preset is set to "Unsigned"
4. Check that your Cloudinary account has available upload credits (free tier has limits) 