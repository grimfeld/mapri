import { atom } from "nanostores";
import { getRandomAvatarUrl } from "@/utils/avatars";
import * as db from "@/lib/db";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { User } from "@/types";

// Local storage keys
const USER_STORAGE_KEY = "mapri_username";

// Default state
const DEFAULT_USER: User = {
  username: "",
  avatarUrl: getRandomAvatarUrl(),
  profilePhoto: undefined,
};

// Load user from localStorage and database if exists
const loadUserFromStorage = async (): Promise<User> => {
  if (typeof window !== "undefined") {
    const storedUsername = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUsername) {
      try {
        // If we have a username, try to load user data from database
        const userData = await db.getUserByUsername(storedUsername);
        if (userData) {
          return userData;
        } else {
          // If user not found in DB but username exists in localStorage
          // Create a default user with the stored username
          return {
            username: storedUsername,
            avatarUrl: getRandomAvatarUrl(),
            profilePhoto: undefined,
          };
        }
      } catch (e) {
        console.error("Error loading user from database:", e);
      }
    }
  }
  return DEFAULT_USER;
};

// User store
export const $currentUser = atom<User>(DEFAULT_USER);

// Initialize the user store
export const initializeUser = async () => {
  if (typeof window !== "undefined") {
    const user = await loadUserFromStorage();
    $currentUser.set(user);
  }
};

// Update user information
export const updateUser = async (user: User) => {
  // Update store
  $currentUser.set(user);

  // Save only username to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, user.username);
  }

  // Save to database if username is set
  if (user.username) {
    try {
      await db.saveUser(user.username, user.avatarUrl, user.profilePhoto);
      showSuccessToast(`Profil "${user.username}" mis à jour avec succès`);
    } catch (error) {
      console.error("Error saving user to database:", error);
      showErrorToast("Échec de la mise à jour du profil");
    }
  }
};

// Update user profile photo
export const updateProfilePhoto = async (profilePhotoUrl: string) => {
  const currentUser = $currentUser.get();

  // Update with new profile photo
  const updatedUser: User = {
    ...currentUser,
    profilePhoto: profilePhotoUrl,
  };

  await updateUser(updatedUser);
};

// Check if user has set a username
export const hasUsername = (): boolean => {
  const user = $currentUser.get();
  return Boolean(user.username);
};

// Fetch all existing users from the database
export const fetchExistingUsers = async (): Promise<User[]> => {
  try {
    // First try to get users from dedicated users table
    const users = await db.getUsers();

    if (users.length > 0) {
      return users;
    }

    // Fallback to getting users from places if users table is empty
    const places = await db.getPlaces();

    // Filter out places without username
    const usersFromPlaces = places
      .filter((place) => place.username && place.avatarUrl)
      .map((place) => ({
        username: place.username!,
        avatarUrl: place.avatarUrl!,
      }));

    // Remove duplicates by username
    const uniqueUsers = Array.from(
      new Map(usersFromPlaces.map((user) => [user.username, user])).values()
    );

    return uniqueUsers;
  } catch (error) {
    console.error("Error fetching existing users:", error);
    return [];
  }
};
