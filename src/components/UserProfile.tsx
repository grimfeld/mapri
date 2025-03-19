import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  $currentUser,
  updateUser,
  updateProfilePhoto,
} from "@/store/user.store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { avatarOptions } from "@/utils/avatars";
import { generateProfileCode, parseProfileCode } from "@/utils/profile";
import { Copy, Import, SwitchCamera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ProfileSelectionDialog from "./ProfileSelectionDialog";
import { ImageUploader } from "./ui/image-uploader";
import { uploadProfileImage } from "@/lib/firebase";

export default function UserProfile() {
  const currentUser = useStore($currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(
    currentUser.avatarUrl
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(
    currentUser.profilePhoto
  );
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    await updateUser({
      username,
      avatarUrl: selectedAvatarUrl,
      profilePhoto: profilePhotoUrl,
    });
    setIsOpen(false);
  };

  const handleImport = async () => {
    setImportError(null);
    const user = parseProfileCode(importCode.trim());
    if (user) {
      await updateUser(user);
      setUsername(user.username);
      setSelectedAvatarUrl(user.avatarUrl);
      setProfilePhotoUrl(user.profilePhoto);
      setActiveTab("profile");
      setImportCode("");
    } else {
      setImportError("Code de profil invalide");
    }
  };

  const handleExport = async () => {
    const code = generateProfileCode(currentUser);
    await navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSwitchProfile = () => {
    setIsOpen(false);
    setShowProfileDialog(true);
  };

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const photoUrl = await uploadProfileImage(file);
      setProfilePhotoUrl(photoUrl);
      return photoUrl;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Get initials from username for avatar fallback
  const getInitials = () => {
    if (!currentUser.username) return "?";
    return currentUser.username.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto flex items-center gap-2"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage
                src={currentUser.profilePhoto || currentUser.avatarUrl}
                alt={currentUser.username || "User"}
              />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {currentUser.username || "Set Username"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Votre Profil</DialogTitle>
            <DialogDescription>
              Gérez votre profil et transférez-le entre appareils
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="export">Exporter</TabsTrigger>
              <TabsTrigger value="import">Importer</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
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
                  buttonText="Ajouter/modifier photo de profil"
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
              <DialogFooter className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSwitchProfile}
                  className="flex items-center gap-2"
                >
                  <SwitchCamera className="h-4 w-4" />
                  <span>Changer de profil</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!username.trim() || isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>En cours...</span>
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Copiez ce code pour transférer votre profil vers un autre
                  appareil
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generateProfileCode(currentUser)}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="shrink-0"
                  >
                    <Copy
                      className={`h-4 w-4 ${
                        copySuccess ? "text-green-500" : ""
                      }`}
                    />
                  </Button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-green-500">Code copié !</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Collez le code de profil pour restaurer vos informations
                </p>
                <div className="flex gap-2">
                  <Input
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    placeholder="Collez votre code de profil"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleImport}
                    className="shrink-0"
                  >
                    <Import className="h-4 w-4" />
                  </Button>
                </div>
                {importError && (
                  <p className="text-sm text-red-500">{importError}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Profile Selection Dialog */}
      <ProfileSelectionDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
}
