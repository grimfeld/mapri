import { Place } from "@/types";
import { atom, computed } from "nanostores";
import * as db from "@/lib/db";
import { Comment } from "@/types";
import { generateRandomId, calculateDistance } from "@/utils/helpers";

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
      ...data,
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
    const success = await db.updatePlace(updatedPlace);

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
 * Show only open places filter
 */
export const $showOpenOnly = atom<boolean>(false);

export const setShowOpenOnly = (value: boolean) => {
  $showOpenOnly.set(value);
};

/**
 * Sort by distance
 */
export const $sortByDistance = atom<boolean>(true);

export const setSortByDistance = (value: boolean) => {
  $sortByDistance.set(value);
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
 * User location store
 */
export const $userLocation = atom<{ lat: number; lng: number } | null>(null);

$userLocation.listen((location) => {
  if (location) {
    console.log("User location:", location);
  }
});

export const setUserLocation = (
  location: { lat: number; lng: number } | null
) => {
  $userLocation.set(location);
};

/**
 * Price range filter
 */
export const $priceRangeFilter = atom<string | null>(null);

export const setPriceRangeFilter = (priceRange: string | null) => {
  $priceRangeFilter.set(priceRange);
};

/**
 * Filtered locations logic
 */

export const $filteredLocations = computed(
  [
    $locations,
    $typeFilter,
    $tagFilters,
    $showOpenOnly,
    $userLocation,
    $sortByDistance,
    $priceRangeFilter,
  ],
  (
    locations,
    typeFilter,
    tagFilters,
    showOpenOnly,
    userLocation,
    sortByDistance,
    priceRangeFilter
  ) => {
    // First, apply all filters
    let filtered = locations.filter((location: Place) => {
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

      // Filter by price range if specified
      if (priceRangeFilter) {
        // Always include locations without price range
        if (!location.priceRange) {
          // Pass the filter if no price range is defined
        }
        // "or less" rule: only check if location has a price range
        else if (location.priceRange) {
          // Compare by number of € symbols (length of the string)
          if (location.priceRange.length > priceRangeFilter.length) {
            return false; // Filter out if the price is higher than selected
          }
        }
      }

      // Filter by open status if enabled
      if (showOpenOnly) {
        if (!isLocationCurrentlyOpen(location)) {
          return false;
        }
      }

      return true;
    });

    // Then, apply sorting if needed
    if (sortByDistance && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.lat,
          a.lng
        );
        const distanceB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.lat,
          b.lng
        );
        return distanceA - distanceB;
      });
    }

    return filtered;
  }
);

/**
 * Helper function to check if a location is currently open
 */
function isLocationCurrentlyOpen(location: Place): boolean {
  // If opening or closing time is not set, can't determine if open
  if (!location.openingTime || !location.closingTime) {
    return true;
  }

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeString = `${currentHours
    .toString()
    .padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`;

  // Parse opening and closing times to compare with current time
  const openingTime = location.openingTime;
  const closingTime = location.closingTime;

  // Simple case: opening time is before closing time (e.g., 9:00 to 17:00)
  if (openingTime <= closingTime) {
    return currentTimeString >= openingTime && currentTimeString <= closingTime;
  }
  // Complex case: closing time is after midnight (e.g., 22:00 to 02:00)
  else {
    return currentTimeString >= openingTime || currentTimeString <= closingTime;
  }
}

/**
 * Comments logic
 */
export const $locationComments = atom<Comment[]>([]);

export const loadComments = async (locationId: string) => {
  try {
    $isLoading.set(true);
    $error.set(null);
    const comments = await db.getCommentsByLocationId(locationId);
    $locationComments.set(comments);
  } catch (err) {
    console.error("Error loading comments:", err);
    $error.set("Failed to load comments");
  } finally {
    $isLoading.set(false);
  }
};

export const addComment = async (data: {
  locationId: string;
  username: string;
  avatarUrl?: string;
  content: string;
}) => {
  try {
    $isLoading.set(true);
    $error.set(null);

    const comment = {
      id: generateRandomId(),
      ...data,
    };

    // Add to database
    const success = await db.addComment(comment);

    if (success) {
      await loadComments(data.locationId);
    } else {
      $error.set("Failed to add comment to database");
    }
  } catch (err) {
    console.error("Error adding comment:", err);
    $error.set("Failed to add comment");
  } finally {
    $isLoading.set(false);
  }
};

export const deleteComment = async (commentId: string, locationId: string) => {
  try {
    $isLoading.set(true);
    $error.set(null);

    // Delete from database
    const success = await db.deleteComment(commentId);

    if (success) {
      await loadComments(locationId);
    } else {
      $error.set("Failed to delete comment from database");
    }
  } catch (err) {
    console.error("Error deleting comment:", err);
    $error.set("Failed to delete comment");
  } finally {
    $isLoading.set(false);
  }
};
