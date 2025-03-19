import { useState, useEffect } from "react";
import Header from "./Header";
import ListView from "./ListView";
import MapView from "./MapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { List, Map } from "lucide-react";
import FiltersBar from "./FiltersBar";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import PlaceForm from "./PlaceForm";
import { Button } from "./ui/button";
import { initializeStore } from "@/store/locations.store";
import UserLocationProvider from "./UserLocationProvider";

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState("list");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize store
  useEffect(() => {
    initializeStore().then(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <UserLocationProvider />
      <Header />
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col gap-4 p-4 grow max-h-[calc(100vh-57px)]"
      >
        <div className="bg-white">
          <TabsList className="self-center w-full">
            <TabsTrigger value="list" className="flex gap-1 items-center px-4">
              <List className="h-4 w-4" />
              <span>Liste</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex gap-1 items-center px-4">
              <Map className="h-4 w-4" />
              <span>Carte</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <FiltersBar />

        <TabsContent
          value="list"
          className="grow m-0 border-0 flex-1 overflow-hidden"
        >
          <ListView />
        </TabsContent>
        <TabsContent
          value="map"
          className="grow m-0 border-0 flex-1 overflow-hidden"
        >
          <MapView />
        </TabsContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Ajouter un lieu</Button>
          </DialogTrigger>
          <DialogContent>
            <PlaceForm
              onClose={() => {
                setIsOpen(false);
                setActiveTab("map");
              }}
            />
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
}
