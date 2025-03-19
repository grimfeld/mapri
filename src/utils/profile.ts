import { User } from "@/types";

// Function to generate a shareable code from user profile
export function generateProfileCode(user: User): string {
  // Convert user object to base64
  const userString = JSON.stringify(user);
  const base64 = btoa(userString);
  return base64;
}

// Function to parse a profile code and return user data
export function parseProfileCode(code: string): User | null {
  try {
    // Decode base64 string and parse JSON
    const userString = atob(code);
    const user = JSON.parse(userString);

    // Validate the user object has required fields
    if (
      typeof user.username === "string" &&
      typeof user.avatarUrl === "string"
    ) {
      return user as User;
    }
    return null;
  } catch (error) {
    console.error("Error parsing profile code:", error);
    return null;
  }
}
