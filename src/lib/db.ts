import { Place, PlaceType } from "@/types";
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
        address TEXT NOT NULL
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
        tags: tags,
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
      INSERT INTO places (id, name, type, lat, lng, address)
      VALUES (${place.id}, ${place.name}, ${place.type}, ${place.lat}, ${place.lng}, ${place.address})
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
          address = ${place.address}
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
