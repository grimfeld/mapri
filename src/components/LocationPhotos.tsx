import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

interface LocationPhotosProps {
  photos: string[];
  className?: string;
}

export default function LocationPhotos({
  photos,
  className = "",
}: LocationPhotosProps) {
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <Carousel className={cn("relative", className)}>
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={index}>
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={photo}
                alt={`Location photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {photos.length > 1 && (
        <>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/40 text-white rounded-full w-8 h-8 border-none" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/40 text-white rounded-full w-8 h-8 border-none" />
        </>
      )}
    </Carousel>
  );
}
