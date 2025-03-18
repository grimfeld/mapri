import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { setSelectedLocation } from "@/store/locations.store";

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
  icon?: string;
  place_id?: number;
}

export default function AddressSearch() {
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Debounced search for real-time results
  useEffect(() => {
    if (!address.trim() || address.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(address);
    }, 300);

    return () => clearTimeout(timer);
  }, [address]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Using OpenStreetMap Nominatim API for geocoding with expanded parameters
      // to include landmarks, attractions, and more location types
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "MapRi Application", // Nominatim requires a User-Agent
          },
          mode: "cors", // Ensuring CORS is properly specified
          cache: "no-cache", // Don't use service worker cache
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search address: ${response.status}`);
      }

      const data = (await response.json()) as GeocodingResult[];

      if (data.length === 0) {
        setSearchResults([]);
      } else {
        // Sort results by importance
        const sortedResults = [...data].sort(
          (a, b) => (b.importance || 0) - (a.importance || 0)
        );
        setSearchResults(sortedResults);
        setShowResults(true);
      }
    } catch (err) {
      console.error("Error searching address:", err);
      setError(
        "Recherche impossible. Veuillez vérifier votre connexion internet."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      setError("Veuillez entrer une adresse ou un monument");
      return;
    }

    performSearch(address);
  };

  const selectResult = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedLocation({ lat, lng, name: result.display_name });
    setAddress("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Rechercher une adresse, un monument, un restaurant..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pr-8 placeholder:text-xs"
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
          />
          {address && (
            <button
              type="button"
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setAddress("");
                setSearchResults([]);
                setShowResults(false);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </form>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
          <div className="py-1">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-start gap-2"
                onClick={() => selectResult(result)}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-sm font-medium break-words">
                    {result.display_name}
                  </p>
                  {result.type && (
                    <p className="text-xs text-gray-500">
                      {result.type.charAt(0).toUpperCase() +
                        result.type.slice(1)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
