import  { CheckCircle, Scale } from 'lucide-react';

interface VehicleSelectorProps {
  selectedVehicle: 'bike' | 'van' | null;
  onVehicleSelect: (vehicle: 'bike' | 'van') => void;
}

export function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Vehicle Type</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
            ${selectedVehicle === 'bike' 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-blue-200'}`}
          onClick={() => onVehicleSelect('bike')}
        >
          <div className="aspect-video relative overflow-hidden bg-gray-100">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/1bdf6e9e-0cc1-43ab-a69d-bdd924148700/public"
              alt="Delivery bike scooter"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          <div className="p-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Bike Courier</h4>
              {selectedVehicle === 'bike' && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>
        </div>
        
        <div 
          className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
            ${selectedVehicle === 'van' 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-blue-200'}`}
          onClick={() => onVehicleSelect('van')}
        >
          <div className="aspect-video relative overflow-hidden bg-gray-100">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/7b7ceb4e-9cdc-4cbb-68d6-4d5564a70a00/public"
              alt="White delivery van side view"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          <div className="p-3">
            <div className="flex justify-between items-center mb-1">
              <div className="font-medium text-gray-900">Van</div>
              {selectedVehicle === 'van' && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Scale className="w-4 h-4" />
              <span>A: 2500mm × B: 1500mm × Weight: 800kg</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        * Vehicle selection may affect pricing and estimated delivery times
      </div>
    </div>
  );
}
 