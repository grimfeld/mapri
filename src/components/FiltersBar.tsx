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
  clearTagFilters,
  toggleTagFilter,
  setTypeFilter,
} from "@/store/locations.store";
import { placeTypeLabels } from "@/types";
import { useStore } from "@nanostores/react";
import { Check, Tag, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function FiltersBar() {
  const availableTags = useStore($availableTags);
  const selectedTags = useStore($tagFilters);
  const typeFilter = useStore($typeFilter);

  const handleTypeFilterChange = (value: string) => {
    // If we're changing type filter, clear tag filters to avoid confusion
    clearTagFilters();

    if (value === "all") {
      setTypeFilter("");
    } else {
      setTypeFilter(value);
    }
  };

  const handleTagClick = (tag: string) => {
    toggleTagFilter(tag);
  };

  const showTags = typeFilter !== "" && availableTags.length > 0;

  return (
    <Card className="py-4">
      <CardContent className="flex space-x-2 items-center flex-wrap gap-2">
        <h2 className="text-lg font-bold">Filtres</h2>
        <Select
          defaultValue="all"
          value={typeFilter || "all"}
          onValueChange={handleTypeFilterChange}
        >
          <SelectTrigger className="min-w-32 grow">
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
                onClick={clearTagFilters}
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
