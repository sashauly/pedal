import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navigation, Plus, Minus } from "lucide-react";
import { Map as LeafletMap } from "leaflet";

interface MapControlsProps {
  map: LeafletMap;
  onCenterLocation: () => void;
  // onDownloadRegion: () => void;
  // onSettings: () => void;
  className?: string;
}

export function MapControls({
  map,
  onCenterLocation,
  // onDownloadRegion,
  // onSettings,
  className,
}: MapControlsProps) {
  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };
  return (
    <>
      {/* Right center controls */}
      <div
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2",
          className
        )}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={onCenterLocation}
          disabled
        >
          <Navigation className="h-4 w-4" />
        </Button>

        <div className="flex flex-col gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomIn}
            title="Приблизить"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomOut}
            title="Отдалить"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Top right controls */}
      {/* <div className="fixed top-4 right-4 z-40 flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={onDownloadRegion}
          className="h-10 w-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={onSettings}
          className="h-10 w-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div> */}
    </>
  );
}
