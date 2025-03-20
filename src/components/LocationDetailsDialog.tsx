import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  $currentLocation,
  $locationComments,
  $userLocation,
  addComment,
  loadComments,
  deleteComment,
  addLocationPhoto,
} from "@/store/locations.store";
import { $currentUser } from "@/store/user.store";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { PlaceType, placeTypeLabels, placeTypeColors } from "@/types";
import {
  MapPin,
  Tag,
  Navigation,
  CircleDollarSign,
  Clock,
  Globe,
  Send,
  Trash2,
  MessageSquare,
  User,
  ImagePlus,
} from "lucide-react";
import { calculateDistance, formatDistance } from "@/utils/helpers";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import LocationPhotos from "./LocationPhotos";
import { ImageUploader } from "./ui/image-uploader";
import { uploadLocationImage } from "@/lib/firebase";

// Helper function to format datetime relative to current time
function formatDateTimeRelative(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return "à l'instant";
  }

  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 60) {
    return `il y a ${diffMin} ${diffMin === 1 ? "minute" : "minutes"}`;
  }

  // Convert to hours
  const diffHours = Math.floor(diffMin / 60);

  if (diffHours < 24) {
    return `il y a ${diffHours} ${diffHours === 1 ? "heure" : "heures"}`;
  }

  // Convert to days
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 30) {
    return `il y a ${diffDays} ${diffDays === 1 ? "jour" : "jours"}`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString("fr-FR");
}

export interface LocationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LocationDetailsDialog({
  open,
  onOpenChange,
}: LocationDetailsDialogProps) {
  const location = useStore($currentLocation);
  const comments = useStore($locationComments);
  const userLocation = useStore($userLocation);
  const currentUser = useStore($currentUser);
  const [newComment, setNewComment] = useState("");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load the comments when the location changes
    if (location) {
      loadComments(location.id);
    }
  }, [location]);

  const handleSubmitComment = async () => {
    if (!location || !newComment.trim() || !currentUser.username) {
      if (!currentUser.username) {
        showErrorToast("Vous devez avoir un profil pour commenter");
      } else if (!newComment.trim()) {
        showErrorToast("Le commentaire ne peut pas être vide");
      }
      return;
    }

    const result = await addComment({
      locationId: location.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      content: newComment.trim(),
    });

    if (result) {
      showSuccessToast("Commentaire ajouté avec succès");
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!location) return;

    const success = await deleteComment(commentId, location.id);
    if (success) {
      showSuccessToast("Commentaire supprimé avec succès");
    } else {
      showErrorToast("Échec de la suppression du commentaire");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!location) return;

    try {
      setIsUploading(true);
      const photoUrl = await uploadLocationImage(file);
      await addLocationPhoto(location.id, photoUrl);
      showSuccessToast("Photo ajoutée avec succès");
      setShowPhotoUpload(false);
      return photoUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      showErrorToast("Échec du téléchargement de l'image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{location.name}</DialogTitle>
          <div className="flex items-center mt-1">
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: placeTypeColors[location.type as PlaceType],
              }}
            >
              {placeTypeLabels[location.type as PlaceType]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location photos */}
          <div>
            {location.photos && location.photos.length > 0 ? (
              <div className="space-y-2">
                <LocationPhotos photos={location.photos} />
                {currentUser.username && (
                  <>
                    {showPhotoUpload ? (
                      <div className="mt-4">
                        <ImageUploader
                          onImageUpload={handleImageUpload}
                          buttonText="Ajouter une photo"
                          className="max-w-full mx-auto"
                        />
                        {isUploading ? (
                          <div className="flex items-center justify-center mt-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                            <span className="text-sm">
                              Téléchargement en cours...
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPhotoUpload(false)}
                            >
                              Annuler
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex items-center gap-1"
                          onClick={() => setShowPhotoUpload(true)}
                        >
                          <ImagePlus className="h-3 w-3" />
                          Ajouter une photo
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : currentUser.username ? (
              showPhotoUpload ? (
                <div className="mb-4">
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    buttonText="Ajouter une photo"
                    className="max-w-full mx-auto"
                  />
                  {isUploading ? (
                    <div className="flex items-center justify-center mt-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                      <span className="text-sm">
                        Téléchargement en cours...
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPhotoUpload(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowPhotoUpload(true)}
                    className="flex items-center gap-2"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Ajouter la première photo
                  </Button>
                </div>
              )
            ) : null}
          </div>

          {/* Location details */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 min-w-4 mr-2 " />
              <span>{location.address}</span>
            </div>

            {location.priceRange && (
              <div className="flex items-center text-sm text-gray-500">
                <CircleDollarSign className="h-4 w-4 mr-2" />
                <span>{location.priceRange}</span>
              </div>
            )}

            {location.openingTime && location.closingTime && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  {location.openingTime} - {location.closingTime}
                </span>
              </div>
            )}

            {userLocation && (
              <div className="flex items-center text-sm text-gray-500">
                <Navigation className="h-4 w-4 mr-2" />
                <span>
                  {formatDistance(
                    calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      location.lat,
                      location.lng
                    )
                  )}
                </span>
              </div>
            )}

            {location.tags && location.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
                <Tag className="h-4 w-4 mr-1" />
                <div className="flex flex-wrap gap-1">
                  {location.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs py-0 h-5"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {location.username && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={location.avatarUrl}
                    alt={location.username}
                  />
                  <AvatarFallback>
                    {location.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>Ajouté par {location.username}</span>
              </div>
            )}
          </div>

          {/* Map link */}
          <div>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                location.name + " " + location.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-500 hover:text-blue-600"
            >
              <Globe className="h-4 w-4 mr-2" />
              <span>Voir sur Google Maps</span>
            </a>
          </div>

          <Separator />

          {/* Comments section */}
          <div>
            <h3 className="flex items-center text-lg font-medium mb-3">
              <MessageSquare className="h-5 w-5 mr-2" />
              Commentaires ({comments.length})
            </h3>

            {!currentUser.username ? (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <p>Définissez un profil pour ajouter des commentaires</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.profilePhoto || currentUser.avatarUrl}
                      alt={currentUser.username}
                    />
                    <AvatarFallback>
                      {currentUser.username[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 min-h-[80px]"
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-[200px] mt-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  Aucun commentaire pour ce lieu
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={comment.avatarUrl}
                          alt={comment.username}
                        />
                        <AvatarFallback>
                          {comment.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {comment.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTimeRelative(comment.createdAt)}
                          </div>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                        {comment.username === currentUser.username && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-500 hover:text-red-600 mt-1"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
