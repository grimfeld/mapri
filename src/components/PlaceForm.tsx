import { useState } from "react";
import { PlaceType, placeTypeLabels, Tag } from "../types";
import { addLocation } from "../store/locations.store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Save, MapPin, X, Plus } from "lucide-react";
import { DialogTitle, DialogHeader, DialogFooter } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import {
  $selectedLocation,
  setSelectedLocation,
} from "@/store/locations.store";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AddressSearch from "./AddressSearch";
import { Label } from "./ui/label";
import { generateRandomId } from "@/utils/helpers";
import { Badge } from "./ui/badge";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const formSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["restaurant", "bar", "cafe", "park", "attraction", "other"]),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  priceRange: z.enum(["€", "€€", "€€€"]).optional(),
});

interface Props {
  onClose?: () => void;
}

export default function PlaceForm({ onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const selectedLocation = useStore($selectedLocation);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "restaurant",
      openingTime: "",
      closingTime: "",
      priceRange: undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!selectedLocation) {
        setError("Veuillez sélectionner une adresse");
        return;
      }

      await addLocation({
        name: data.name,
        type: data.type,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedLocation.name,
        tags: tags,
        openingTime: data.openingTime || undefined,
        closingTime: data.closingTime || undefined,
        priceRange: data.priceRange,
      });

      // Reset form
      form.reset();
      setSelectedLocation(null);
      setTags([]);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Une erreur est survenue lors de l'ajout du lieu");
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

  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle>Ajouter un lieu</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-2 rounded text-sm">
              {error}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nom
                </FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    placeholder="Nom du lieu"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as PlaceType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(placeTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags field */}
          <div>
            <Label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tags
            </Label>
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

          {/* Location field */}
          <Label>Adresse</Label>
          {selectedLocation ? (
            <div className="flex items-center bg-gray-50 rounded p-2 text-sm w-full">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700 flex-1">
                {selectedLocation.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedLocation(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <AddressSearch />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="openingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor="openingTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Heure d'ouverture
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="openingTime"
                      type="time"
                      placeholder="Heure d'ouverture"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor="closingTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Heure de fermeture
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="closingTime"
                      type="time"
                      placeholder="Heure de fermeture"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel
                    htmlFor="priceRange"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Fourchette de prix (optionnel)
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="€" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          €
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="€€" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer w-4">
                          €€
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="€€€" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer w-6">
                          €€€
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className={cn("gap-1", {
                "opacity-50 pointer-events-none": !selectedLocation,
              })}
              disabled={!selectedLocation}
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
