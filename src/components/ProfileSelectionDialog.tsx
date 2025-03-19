import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { fetchExistingUsers, updateUser } from "@/store/user.store";
import { avatarOptions } from "@/utils/avatars";
import { User as UserIcon, PlusCircle } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { ImageUploader } from "./ui/image-uploader";
import { uploadProfileImage } from "@/lib/firebase";
import { User } from "@/types";

interface ProfileSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSelectionDialog({
  open,
  onOpenChange,
}: ProfileSelectionDialogProps) {
  const [activeTab, setActiveTab] = useState("existing");
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(avatarOptions[0]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(
    undefined
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Fetch existing users when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingUsers();
    }
  }, [open]);

  const loadExistingUsers = async () => {
    setLoading(true);
    try {
      const users = await fetchExistingUsers();
      setExistingUsers(users);
    } catch (error) {
      console.error("Error loading existing users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    try {
      await updateUser(user);
      showSuccessToast(`Profil "${user.username}" sélectionné`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error selecting user:", error);
      showErrorToast("Échec de la sélection du profil");
    }
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) return;

    try {
      await updateUser({
        username: username.trim(),
        avatarUrl: selectedAvatarUrl,
        profilePhoto: profilePhotoUrl,
      });
      showSuccessToast(`Profil "${username.trim()}" créé avec succès`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating profile:", error);
      showErrorToast("Échec de la création du profil");
    }
  };

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadProfileImage(file);
      setProfilePhotoUrl(photoUrl);
      return photoUrl;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      showErrorToast("Échec du téléchargement de la photo de profil");
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Get initials from username for avatar fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bienvenue sur MapRi</DialogTitle>
          <DialogDescription>
            Sélectionnez votre profil ou créez-en un nouveau
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Profils existants</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau profil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : existingUsers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Aucun profil existant</p>
                <Button onClick={() => setActiveTab("new")}>
                  Créer un nouveau profil
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {existingUsers.map((user) => (
                  <Button
                    key={user.username}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={user.profilePhoto || user.avatarUrl}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Nom d'utilisateur
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>

            {/* Profile Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Photo de profil (optionnel)
              </label>
              <ImageUploader
                onImageUpload={handleProfilePhotoUpload}
                previewUrl={profilePhotoUrl}
                className="max-w-xs mx-auto"
                buttonText="Ajouter une photo de profil"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ou sélectionnez un avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((avatarUrl, index) => (
                  <Avatar
                    key={index}
                    className={`h-10 w-10 cursor-pointer transition-all ${
                      selectedAvatarUrl === avatarUrl
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                    onClick={() => setSelectedAvatarUrl(avatarUrl)}
                  >
                    <AvatarImage
                      src={avatarUrl}
                      alt={`Avatar option ${index + 1}`}
                    />
                  </Avatar>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCreateProfile}
                disabled={!username.trim() || uploadingPhoto}
                className="mt-2"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>En cours...</span>
                  </>
                ) : (
                  "Créer profil"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
