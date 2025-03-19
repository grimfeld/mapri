import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { PlaceType, placeTypeLabels, Tag, PriceRange } from "../types";
import {
  updateLocation,
  deleteLocation,
  $currentLocation,
} from "../store/locations.store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Trash2, Save, X, Plus } from "lucide-react";
import {
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { generateRandomId } from "@/utils/helpers";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

interface Props {
  onClose?: () => void;
}

export default function PlaceEditForm({ onClose }: Props) {
  const currentLocation = useStore($currentLocation);

  const [name, setName] = useState(currentLocation?.name || "");
  const [type, setType] = useState<PlaceType>(
    currentLocation?.type || "restaurant"
  );
  const [tags, setTags] = useState<Tag[]>(currentLocation?.tags || []);
  const [openingTime, setOpeningTime] = useState<string | undefined>(
    currentLocation?.openingTime
  );
  const [closingTime, setClosingTime] = useState<string | undefined>(
    currentLocation?.closingTime
  );
  const [priceRange, setPriceRange] = useState<PriceRange | undefined>(
    currentLocation?.priceRange
  );
  const [newTag, setNewTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      setName(currentLocation.name);
      setType(currentLocation.type);
      setTags(currentLocation.tags || []);
      setOpeningTime(currentLocation.openingTime);
      setClosingTime(currentLocation.closingTime);
      setPriceRange(currentLocation.priceRange);
    }
  }, [currentLocation]);

  // Handle form submission for updating
  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }

    if (!currentLocation) {
      setError("Aucun lieu sélectionné");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateLocation({
        id: currentLocation.id,
        name: name.trim(),
        type,
        tags,
        openingTime,
        closingTime,
        priceRange,
      });
      if (onClose) onClose();
    } catch (err) {
      console.error("Error updating place:", err);
      setError("Erreur lors de la mise à jour. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce lieu ?")) {
      return;
    }

    if (!currentLocation) {
      setError("Aucun lieu sélectionné");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteLocation();
      if (onClose) onClose();
    } catch (err) {
      console.error("Error deleting place:", err);
      setError("Erreur lors de la suppression. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() === "") return;

    // Check if tag already exists
    if (tags.some((tag) => tag.name.toLowerCase() === newTag.toLowerCase())) {
      return;
    }

    const tag: Tag = {
      id: generateRandomId(),
      name: newTag.trim(),
    };

    setTags([...tags, tag]);
    setNewTag("");
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((tag) => tag.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // If no place selected, don't render
  if (!currentLocation) {
    return null;
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modifier le lieu</DialogTitle>
      </DialogHeader>
      {/* Name field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          placeholder="Nom du lieu"
        />
      </div>

      {/* Type field */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Type
        </label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as PlaceType)}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Type de lieu" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(placeTypeLabels).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opening & Closing Time fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="openingTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Heure d'ouverture
          </label>
          <Input
            id="openingTime"
            type="time"
            value={openingTime || ""}
            onChange={(e) => setOpeningTime(e.target.value || undefined)}
            className="w-full"
            placeholder="Heure d'ouverture"
          />
        </div>

        <div>
          <label
            htmlFor="closingTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Heure de fermeture
          </label>
          <Input
            id="closingTime"
            type="time"
            value={closingTime || ""}
            onChange={(e) => setClosingTime(e.target.value || undefined)}
            className="w-full"
            placeholder="Heure de fermeture"
          />
        </div>
      </div>

      {/* Price Range field */}
      <div className="flex flex-col justify-end">
        <label
          htmlFor="priceRange"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Fourchette de prix (optionnel)
        </label>
        <RadioGroup
          value={priceRange}
          onValueChange={(value: PriceRange) => setPriceRange(value)}
          className="flex space-x-2"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem id="price-€" value="€" />
            <Label htmlFor="price-€" className="font-normal cursor-pointer">
              €
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem id="price-€€" value="€€" />
            <Label htmlFor="price-€€" className="font-normal cursor-pointer">
              €€
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem id="price-€€€" value="€€€" />
            <Label htmlFor="price-€€€" className="font-normal cursor-pointer">
              €€€
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Tags field */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags
        </label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.name}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="tags"
              placeholder="Ajouter un tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
            />
          </div>
          <Button type="button" size="icon" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        variant="destructive"
        type="button"
        onClick={handleDelete}
        disabled={isSubmitting}
        className="text-white mt-8 "
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </Button>

      <DialogFooter className="flex flex-row">
        <DialogClose asChild>
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting}
            className="grow"
          >
            Annuler
          </Button>
        </DialogClose>
        <Button
          variant="default"
          type="button"
          onClick={handleUpdate}
          disabled={isSubmitting}
          className="grow"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
