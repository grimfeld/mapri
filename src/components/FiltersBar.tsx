import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent } from "./ui/card";
import {
  $availableTags,
  $tagFilters,
  $typeFilter,
  $showOpenOnly,
  $sortByDistance,
  $userLocation,
  $priceRangeFilter,
  clearTagFilters,
  toggleTagFilter,
  setTypeFilter,
  setShowOpenOnly,
  setSortByDistance,
  setPriceRangeFilter,
} from "@/store/locations.store";
import { placeTypeLabels } from "@/types";
import { useStore } from "@nanostores/react";
import {
  Check,
  Tag,
  X,
  Clock,
  Navigation,
  CircleDollarSign,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { showInfoToast } from "@/utils/toast";

export default function FiltersBar() {
  const availableTags = useStore($availableTags);
  const selectedTags = useStore($tagFilters);
  const typeFilter = useStore($typeFilter);
  const showOpenOnly = useStore($showOpenOnly);
  const sortByDistance = useStore($sortByDistance);
  const userLocation = useStore($userLocation);
  const priceRangeFilter = useStore($priceRangeFilter);

  const handleTypeFilterChange = (value: string) => {
    // If we're changing type filter, clear tag filters to avoid confusion
    clearTagFilters();

    if (value === "all") {
      setTypeFilter("");
      showInfoToast("Filtre par type supprimé");
    } else {
      setTypeFilter(value);
      showInfoToast(
        `Filtre appliqué: ${
          placeTypeLabels[value as keyof typeof placeTypeLabels]
        }`
      );
    }
  };

  const handleTagClick = (tag: string) => {
    toggleTagFilter(tag);

    // Check if the tag was added or removed
    const tagExists = selectedTags.includes(tag);
    if (tagExists) {
      showInfoToast(`Tag "${tag}" supprimé`);
    } else {
      showInfoToast(`Tag "${tag}" ajouté`);
    }
  };

  const handleShowOpenChange = (checked: boolean) => {
    setShowOpenOnly(checked);
    if (checked) {
      showInfoToast("Affichage des lieux ouverts uniquement");
    } else {
      showInfoToast("Affichage de tous les lieux");
    }
  };

  const handleSortByDistanceChange = (checked: boolean) => {
    setSortByDistance(checked);
    if (checked) {
      showInfoToast("Tri par distance activé");
    } else {
      showInfoToast("Tri par distance désactivé");
    }
  };

  const handlePriceRangeChange = (value: string) => {
    setPriceRangeFilter(value === "all" ? null : value);
    if (value === "all") {
      showInfoToast("Filtre de prix supprimé");
    } else {
      showInfoToast(`Filtre de prix appliqué: ${value}`);
    }
  };

  const handleClearTags = () => {
    clearTagFilters();
    showInfoToast("Tous les tags ont été supprimés");
  };

  const showTags = typeFilter !== "" && availableTags.length > 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <h2 className="font-bold">Filtres</h2>
        <Select
          defaultValue="all"
          value={typeFilter || "all"}
          onValueChange={handleTypeFilterChange}
        >
          <SelectTrigger className="min-w-32 w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {Object.entries(placeTypeLabels).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range Filter */}
        <div className="flex gap-2">
          <div className="flex items-center">
            <CircleDollarSign className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Prix:</span>
          </div>
          <Select
            value={priceRangeFilter || "all"}
            onValueChange={handlePriceRangeChange}
          >
            <SelectTrigger className="min-w-32 grow">
              <SelectValue placeholder="Prix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="€">€</SelectItem>
              <SelectItem value="€€">€€</SelectItem>
              <SelectItem value="€€€">€€€</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-1" />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showOpen"
              checked={showOpenOnly}
              onCheckedChange={handleShowOpenChange}
            />
            <Label
              htmlFor="showOpen"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              <span>Lieux ouverts</span>
            </Label>
          </div>

          {userLocation && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sortByDistance"
                checked={sortByDistance}
                onCheckedChange={handleSortByDistanceChange}
              />
              <Label
                htmlFor="sortByDistance"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>Trier par distance</span>
              </Label>
            </div>
          )}
        </div>

        {showTags ? (
          <div className="flex flex-wrap gap-2 items-center mt-2 md:mt-0 w-full">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Tags:</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => handleTagClick(tag)}
                >
                  {selectedTags.includes(tag) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {tag}
                </Badge>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearTags}
                className="h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        ) : typeFilter !== "" && availableTags.length === 0 ? (
          <div className="flex items-center text-sm text-gray-500">
            <Tag className="h-4 w-4 mr-2 text-gray-400" />
            <span>Aucun tag pour ce type</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
