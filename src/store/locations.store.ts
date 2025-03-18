import { Place } from "@/types";
import { atom, computed } from "nanostores";
import * as db from "@/lib/db";
import { generateRandomId } from "@/utils/helpers";

/**
 * Error
 */
export const $error = atom<string | null>(null);

/**
 * Loading
 */
export const $isLoading = atom<boolean>(false);

/**
 * Current location logic
 */

export const $currentLocation = atom<Place | null>(null);

export const setCurrentLocation = (location: Place | null) => {
  $currentLocation.set(location);
};

/**
 * Locations logic
 */
export const $locations = atom<Place[]>([]);

export const initializeStore = async () => {
  try {
    $isLoading.set(true);
    $error.set(null);

    // Initialize database tables
    await db.initializeDatabase();

    await loadLocations();
  } catch (err) {
    console.error("Error initializing store:", err);
    $error.set("Failed to initialize application data");
  } finally {
    $isLoading.set(false);
  }
};

export const loadLocations = async () => {
  try {
    $isLoading.set(true);
    $error.set(null);
    const dbPlaces = await db.getPlaces();
    $locations.set(dbPlaces);
  } catch (err) {
    console.error("Error loading locations:", err);
    $error.set("Failed to load locations");
  } finally {
    $isLoading.set(false);
  }
};

export const addLocation = async (data: Omit<Place, "id">) => {
  try {
    $isLoading.set(true);
    $error.set(null);

    // Add to database
    const success = await db.addPlace({
      id: generateRandomId(),
      name: data.name,
      type: data.type,
      lat: data.lat,
      lng: data.lng,
      address: data.address,
      tags: data.tags || [],
    });

    if (success) {
      loadLocations();
    } else {
      $error.set("Failed to add location to database");
    }
  } catch (err) {
    console.error("Error adding location:", err);
    $error.set("Failed to add location");
  } finally {
    $isLoading.set(false);
  }
};

export const updateLocation = async (data: Partial<Place>) => {
  try {
    $isLoading.set(true);
    $error.set(null);
    const currentLocation = $currentLocation.get();

    if (!currentLocation) {
      $error.set("No location selected");
      return;
    }

    const existingPlaces = $locations.get();
    const existingPlace = existingPlaces.find(
      (place) => place.id === currentLocation.id
    );

    if (!existingPlace) {
      $error.set("Place not found");
      return;
    }

    // Create updated place object
    const updatedPlace = {
      ...existingPlace,
      ...data,
    };

    // Update in database
    const success = await db.updatePlace({
      id: updatedPlace.id,
      name: updatedPlace.name,
      type: updatedPlace.type,
      lat: updatedPlace.lat,
      lng: updatedPlace.lng,
      address: updatedPlace.address,
      tags: updatedPlace.tags || [],
    });

    if (success) {
      loadLocations();
    } else {
      $error.set("Failed to update location in database");
    }
  } catch (err) {
    console.error("Error updating location:", err);
    $error.set("Failed to update location");
  } finally {
    $isLoading.set(false);
  }
};

export const deleteLocation = async () => {
  try {
    $isLoading.set(true);
    $error.set(null);

    const currentLocation = $currentLocation.get();

    if (!currentLocation) {
      $error.set("No location selected");
      return;
    }

    // Delete from database
    const success = await db.deletePlace(currentLocation.id);

    if (success) {
      loadLocations();
    } else {
      $error.set("Failed to delete location from database");
    }
  } catch (err) {
    console.error("Error deleting location:", err);
    $error.set("Failed to delete location");
  } finally {
    $isLoading.set(false);
  }
};

/**
 * Selected location logic
 */

export const $selectedLocation = atom<{
  lat: number;
  lng: number;
  name: string;
} | null>(null);

export const setSelectedLocation = (
  location: {
    lat: number;
    lng: number;
    name: string;
  } | null
) => {
  $selectedLocation.set(location);
};

/**
 * Type filter
 */

export const $typeFilter = atom<string>("");

export const setTypeFilter = (type: string) => {
  $typeFilter.set(type);
};

/**
 * Tag filters
 */
export const $tagFilters = atom<string[]>([]);

export const addTagFilter = (tag: string) => {
  const currentFilters = $tagFilters.get();
  if (!currentFilters.includes(tag)) {
    $tagFilters.set([...currentFilters, tag]);
  }
};

export const removeTagFilter = (tag: string) => {
  const currentFilters = $tagFilters.get();
  $tagFilters.set(currentFilters.filter((t) => t !== tag));
};

export const toggleTagFilter = (tag: string) => {
  const currentFilters = $tagFilters.get();
  if (currentFilters.includes(tag)) {
    removeTagFilter(tag);
  } else {
    addTagFilter(tag);
  }
};

export const clearTagFilters = () => {
  $tagFilters.set([]);
};

/**
 * Available tags
 */
export const $availableTags = computed(
  [$locations, $typeFilter],
  (locations, typeFilter) => {
    const tagsSet = new Set<string>();

    // Filter locations by type if a type filter is set
    const filteredLocations = typeFilter
      ? locations.filter((location) => location.type === typeFilter)
      : locations;

    filteredLocations.forEach((location) => {
      if (location.tags && location.tags.length > 0) {
        location.tags.forEach((tag) => {
          tagsSet.add(tag.name);
        });
      }
    });

    return Array.from(tagsSet).sort();
  }
);

/**
 * Filtered locations logic
 */

export const $filteredLocations = computed(
  [$locations, $typeFilter, $tagFilters],
  (locations, typeFilter, tagFilters) => {
    return locations.filter((location: Place) => {
      // Filter by type if specified
      if (typeFilter && location.type !== typeFilter) {
        return false;
      }

      // Filter by tags if any are selected
      if (tagFilters.length > 0) {
        // Skip locations with no tags
        if (!location.tags || location.tags.length === 0) {
          return false;
        }

        // Check if the location has ALL the selected tags
        const locationTagNames = location.tags.map((tag) => tag.name);
        for (const filter of tagFilters) {
          if (!locationTagNames.includes(filter)) {
            return false;
          }
        }
      }

      return true;
    });
  }
);
