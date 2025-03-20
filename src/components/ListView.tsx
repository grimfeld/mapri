import { useStore } from "@nanostores/react";
import { Button } from "./ui/button";
import {
  Edit,
  Eye,
  MapPin,
  Tag,
  Navigation,
  CircleDollarSign,
} from "lucide-react";
import { placeTypeColors, placeTypeLabels } from "../types";
import {
  $filteredLocations,
  setCurrentLocation,
  $userLocation,
} from "@/store/locations.store";
import { Dialog, DialogTrigger } from "./ui/dialog";
import PlaceEditForm from "./PlaceEditForm";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { calculateDistance, formatDistance } from "@/utils/helpers";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import LocationDetailsDialog from "./LocationDetailsDialog";

export default function ListView() {
  const places = useStore($filteredLocations);
  const userLocation = useStore($userLocation);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <ScrollArea className="h-full">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {places.length === 0 ? (
          <div className="text-center py-10">
            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              {places.length === 0
                ? "Aucun lieu ajouté"
                : "Aucun lieu ne correspond aux filtres sélectionnés"}
            </p>
            {places.length === 0 ? (
              <p className="text-sm text-gray-400">
                Cliquez sur le bouton "+" pour ajouter un lieu
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                // onClick={onOpenAddForm}
                className="mt-2"
              >
                Ajouter un nouveau lieu
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-1">
            {places.map((place) => (
              <div
                key={place.id}
                className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-white shadow-sm"
                onClick={() => {
                  setCurrentLocation(place);
                  setIsDetailsOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-gray-900">
                        {place.name}
                      </h3>
                      <span
                        className="text-xs px-2 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: placeTypeColors[place.type],
                        }}
                      >
                        {placeTypeLabels[place.type]}
                      </span>
                    </div>

                    {place.username && (
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={place.avatarUrl}
                            alt={place.username}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {place.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          Ajouté par {place.username}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="text-xs">
                        {place.address.length > 50
                          ? `${place.address.slice(0, 50)}...`
                          : place.address}
                      </span>
                    </div>

                    {(place.openingTime || place.closingTime) && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span className="text-xs">
                          {place.openingTime && place.closingTime
                            ? `Ouvert de ${place.openingTime} à ${place.closingTime}`
                            : place.openingTime
                            ? `Ouvre à ${place.openingTime}`
                            : `Ferme à ${place.closingTime}`}
                        </span>
                      </div>
                    )}

                    {place.priceRange && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <CircleDollarSign className="h-3 w-3 mr-1" />
                        <span className="text-xs">{place.priceRange}</span>
                      </div>
                    )}

                    {userLocation && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Navigation className="h-3 w-3 mr-1" />
                        <span className="text-xs">
                          {formatDistance(
                            calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              place.lat,
                              place.lng
                            )
                          )}
                        </span>
                      </div>
                    )}

                    {place.tags && place.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Tag className="h-3 w-3 mr-1 text-gray-400" />
                        {place.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs py-0 h-5"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentLocation(place);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentLocation(place);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <PlaceEditForm onClose={() => setIsEditOpen(false)} />
      </Dialog>

      {/* Location details dialog */}
      <LocationDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </ScrollArea>
  );
}
