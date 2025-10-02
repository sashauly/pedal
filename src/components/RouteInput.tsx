import { Input } from "@/components/ui/input";

interface RouteInputProps {
  title: string;
  lat: string;
  lng: string;
  isLoading?: boolean;
  isEnd?: boolean;
}

export default function RouteInput({
  title,
  lat,
  lng,
  isLoading = false,
  isEnd = false,
}: RouteInputProps) {
  return (
    <div className="flex flex-col p-3 border rounded-lg bg-gray-50">
      <p className="text-xs font-semibold mb-2 text-gray-600">{title}</p>

      {isLoading ? (
        <p className="text-sm text-blue-500 animate-pulse">
          Waiting for GPS...
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <Input
            readOnly
            value={`Lat: ${lat}`}
            className="text-sm font-mono p-1 border-b border-gray-300 bg-transparent text-gray-800"
            placeholder="Latitude"
          />
          <Input
            readOnly
            value={`Lng: ${lng}`}
            className="text-sm font-mono p-1 border-b border-gray-300 bg-transparent text-gray-800"
            placeholder="Longitude"
          />
        </div>
      )}
      {isEnd && lat === "Click Map" && (
        <p className="text-xs text-red-500 mt-1">
          Click anywhere on the map to set the destination!
        </p>
      )}
    </div>
  );
}
