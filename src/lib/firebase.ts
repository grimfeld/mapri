import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// Your web app's Firebase configuration - these will need to be provided by the user
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log(firebaseConfig, import.meta.env);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Uploads an image file to Firebase Storage
 *
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'users' or 'locations')
 * @returns The download URL of the uploaded file
 */
export const uploadImage = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    // Create a unique file name
    const fileName = `${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Uploads a profile image
 *
 * @param file - The profile image file
 * @returns The download URL of the uploaded profile image
 */
export const uploadProfileImage = async (file: File): Promise<string> => {
  return uploadImage(file, "profiles");
};

/**
 * Uploads a location image
 *
 * @param file - The location image file
 * @returns The download URL of the uploaded location image
 */
export const uploadLocationImage = async (file: File): Promise<string> => {
  return uploadImage(file, "locations");
};

export default app;
