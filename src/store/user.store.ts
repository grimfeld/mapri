import { atom } from "nanostores";
import { getRandomAvatarUrl } from "@/utils/avatars";
import * as db from "@/lib/db";

export interface User {
  username: string;
  avatarUrl: string;
}

// Local storage keys
const USER_STORAGE_KEY = "mapri_user";

// Default state
const DEFAULT_USER: User = {
  username: "",
  avatarUrl: getRandomAvatarUrl(),
};

// Load user from localStorage if exists
const loadUserFromStorage = (): User => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }
  return DEFAULT_USER;
};

// User store
export const $currentUser = atom<User>(loadUserFromStorage());

// Update user information
export const updateUser = async (user: User) => {
  // Update store
  $currentUser.set(user);

  // Save to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  // Save to database if username is set
  if (user.username) {
    try {
      await db.saveUser(user.username, user.avatarUrl);
    } catch (error) {
      console.error("Error saving user to database:", error);
    }
  }
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
