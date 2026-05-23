import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import { firebaseApp } from './config';

export const storage: FirebaseStorage = getStorage(firebaseApp);

export async function uploadStoryThumbnail(
  storyId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storageRef = ref(storage, `thumbnails/${storyId}`);
    const snap = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000',
    });
    const url = await getDownloadURL(snap.ref);
    return { success: true, url };
  } catch (error) {
    console.error('Storage uploadStoryThumbnail error:', error);
    return { success: false, error: 'Failed to upload thumbnail' };
  }
}

export async function getStoryThumbnailUrl(
  storyId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storageRef = ref(storage, `thumbnails/${storyId}`);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error) {
    console.error('Storage getStoryThumbnailUrl error:', error);
    return { success: false, error: 'Thumbnail not found' };
  }
}

export async function deleteStoryThumbnail(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, `thumbnails/${storyId}`);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Storage deleteStoryThumbnail error:', error);
    return { success: false, error: 'Failed to delete thumbnail' };
  }
}
