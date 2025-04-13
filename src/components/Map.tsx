import  { useEffect, useRef } from 'react';
import { useMap } from '../context/MapContext';
import { MapPin } from 'lucide-react';

export function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { initializeMap } = useMap();

  useEffect(() => {
    // Wait a short moment to ensure DOM is ready
    const timer = setTimeout(() => {
      if (mapRef.current) {
        initializeMap(mapRef.current);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializeMap]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Route Map
          </h2>
          <p className="text-sm text-gray-600">Enter postcodes above to visualize your delivery route</p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
          <div className="text-center text-gray-400">
            <img 
              src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHRydWNrJTIwcm91dGUlMjBjYWxjdWxhdGlvbiUyMG1hcHxlbnwwfHx8fDE3NDM3MTcyOTF8MA"
              alt="Map of Europe showing delivery routes"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Enter UK postcodes to view the delivery route</p>
                <p className="text-xs mt-2">Example: SW1A 1AA (London) or M1 1BB (Manchester)</p>
              </div>
            </div>
          </div>
        </div>
        <div ref={mapRef} className="w-full h-[500px] relative z-10" />
      </div>
      <div className="p-3 bg-gray-50 text-xs text-gray-500 text-center">
        Please enter complete UK postcodes for accurate routing
      </div>
    </div>
  );
}
 