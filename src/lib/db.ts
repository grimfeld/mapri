import { Place, PlaceType, PriceRange } from "@/types";
import { neon } from "@neondatabase/serverless";

// Create a SQL client with the connection string
const sql = neon(import.meta.env.DATABASE_URL);

// Initialize the database tables
export async function initializeDatabase() {
  try {
    // Create the places table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS places (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        address TEXT NOT NULL,
        opening_time TEXT,
        closing_time TEXT,
        price_range TEXT,
        username TEXT,
        avatar_url TEXT,
        photos TEXT[]
      )
    `;

    // Create the tags table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `;

    // Create the location_tags junction table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS location_tags (
        location_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (location_id, tag_id),
        FOREIGN KEY (location_id) REFERENCES places(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `;

    // Create the users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        avatar_url TEXT NOT NULL,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        profile_photo TEXT
      )
    `;

    // Create the comments table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        location_id TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar_url TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES places(id) ON DELETE CASCADE
      )
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Place functions
export async function getPlaces(): Promise<Place[]> {
  try {
    const places = await sql`SELECT * FROM places`;
    const placesWithTags: Place[] = [];

    for (const place of places) {
      const tags = await getTagsByLocationId(place.id as string);
      placesWithTags.push({
        id: place.id as string,
        name: place.name as string,
        type: place.type as PlaceType,
        lat: place.lat as number,
        lng: place.lng as number,
        address: place.address as string,
        openingTime: place.opening_time as string | undefined,
        closingTime: place.closing_time as string | undefined,
        priceRange: place.price_range as PriceRange | undefined,
        username: place.username as string | undefined,
        avatarUrl: place.avatar_url as string | undefined,
        tags: tags,
        photos: place.photos as string[] | undefined,
      });
    }

    return placesWithTags;
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
}

export async function addPlace(place: Place) {
  try {
    await sql`
      INSERT INTO places (id, name, type, lat, lng, address, opening_time, closing_time, price_range, username, avatar_url, photos)
      VALUES (${place.id}, ${place.name}, ${place.type}, ${place.lat}, ${place.lng}, ${place.address}, ${place.openingTime}, ${place.closingTime}, ${place.priceRange}, ${place.username}, ${place.avatarUrl}, ${place.photos})
    `;

    // Add tags if they exist
    if (place.tags && place.tags.length > 0) {
      await addTagsToLocation(place.id, place.tags);
    }

    return true;
  } catch (error) {
    console.error("Error adding place:", error);
    return false;
  } finally {
    console.log("Place added successfully");
  }
}

export async function updatePlace(place: Place) {
  try {
    await sql`  
      UPDATE places 
      SET name = ${place.name}, 
          type = ${place.type},
          lat = ${place.lat}, 
          lng = ${place.lng},
          address = ${place.address},
          opening_time = ${place.openingTime},
          closing_time = ${place.closingTime},
          price_range = ${place.priceRange},
          username = ${place.username},
          avatar_url = ${place.avatarUrl},
          photos = ${place.photos}
      WHERE id = ${place.id}
    `;

    // Update tags - remove all existing tags and add the new ones
    await removeAllTagsFromLocation(place.id);
    if (place.tags && place.tags.length > 0) {
      await addTagsToLocation(place.id, place.tags);
    }

    return true;
  } catch (error) {
    console.error("Error updating place:", error);
    return false;
  } finally {
    console.log("Place updated successfully");
  }
}

export async function deletePlace(id: string) {
  try {
    // The location_tags entries will be deleted automatically due to ON DELETE CASCADE
    await sql`DELETE FROM places WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("Error deleting place:", error);
    return false;
  }
}

// Tag functions
export async function getAllTags() {
  try {
    const tags = await sql`SELECT * FROM tags`;
    return tags.map((tag: Record<string, unknown>) => ({
      id: tag.id as string,
      name: tag.name as string,
    }));
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function getTagsByLocationId(locationId: string) {
  try {
    const tags = await sql`
      SELECT t.id, t.name
      FROM tags t
      JOIN location_tags lt ON t.id = lt.tag_id
      WHERE lt.location_id = ${locationId}
    `;
    return tags.map((tag: Record<string, unknown>) => ({
      id: tag.id as string,
      name: tag.name as string,
    }));
  } catch (error) {
    console.error(`Error fetching tags for location ${locationId}:`, error);
    return [];
  }
}

export async function addTagsToLocation(
  locationId: string,
  tags: { id: string; name: string }[]
) {
  try {
    for (const tag of tags) {
      // First, try to create the tag if it doesn't exist
      try {
        await sql`
          INSERT INTO tags (id, name)
          VALUES (${tag.id}, ${tag.name})
          ON CONFLICT (name) DO NOTHING
        `;
      } catch (error) {
        console.error(`Error adding tag ${tag.name}:`, error);
        continue;
      }

      // Get the tag ID (either newly created or existing)
      const existingTag =
        await sql`SELECT id FROM tags WHERE name = ${tag.name} LIMIT 1`;
      const tagId = existingTag[0]?.id || tag.id;

      // Then add the association
      await sql`
        INSERT INTO location_tags (location_id, tag_id)
        VALUES (${locationId}, ${tagId})
        ON CONFLICT (location_id, tag_id) DO NOTHING
      `;
    }
    return true;
  } catch (error) {
    console.error(`Error adding tags to location ${locationId}:`, error);
    return false;
  }
}

export async function removeAllTagsFromLocation(locationId: string) {
  try {
    await sql`DELETE FROM location_tags WHERE location_id = ${locationId}`;
    return true;
  } catch (error) {
    console.error(`Error removing tags from location ${locationId}:`, error);
    return false;
  }
}

// User functions
export async function getUsers() {
  try {
    const users = await sql`SELECT * FROM users`;
    return users.map((user: Record<string, unknown>) => ({
      username: user.username as string,
      avatarUrl: user.avatar_url as string,
      profilePhoto: user.profile_photo as string | undefined,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function saveUser(
  username: string,
  avatarUrl: string,
  profilePhoto?: string
) {
  try {
    await sql`
      INSERT INTO users (username, avatar_url, profile_photo)
      VALUES (${username}, ${avatarUrl}, ${profilePhoto})
      ON CONFLICT (username) 
      DO UPDATE SET 
        avatar_url = ${avatarUrl},
        profile_photo = COALESCE(${profilePhoto}, users.profile_photo),
        last_active = CURRENT_TIMESTAMP
    `;
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
}

export async function getUserByUsername(username: string) {
  try {
    const users = await sql`
      SELECT * FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      username: user.username as string,
      avatarUrl: user.avatar_url as string,
      profilePhoto: user.profile_photo as string | undefined,
    };
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error);
    return null;
  }
}

// Comment functions
export async function getCommentsByLocationId(locationId: string) {
  try {
    const comments = await sql`
      SELECT * FROM comments
      WHERE location_id = ${locationId}
      ORDER BY created_at DESC
    `;
    return comments.map((comment) => ({
      id: comment.id,
      locationId: comment.location_id,
      username: comment.username,
      avatarUrl: comment.avatar_url,
      content: comment.content,
      createdAt: comment.created_at,
    }));
  } catch (error) {
    console.error(`Error fetching comments for location ${locationId}:`, error);
    return [];
  }
}

export async function addComment(comment: {
  id: string;
  locationId: string;
  username: string;
  avatarUrl?: string;
  content: string;
}) {
  try {
    await sql`
      INSERT INTO comments (id, location_id, username, avatar_url, content)
      VALUES (${comment.id}, ${comment.locationId}, ${comment.username}, ${comment.avatarUrl}, ${comment.content})
    `;
    return true;
  } catch (error) {
    console.error("Error adding comment:", error);
    return false;
  }
}

export async function deleteComment(id: string) {
  try {
    await sql`DELETE FROM comments WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error(`Error deleting comment ${id}:`, error);
    return false;
  }
}
