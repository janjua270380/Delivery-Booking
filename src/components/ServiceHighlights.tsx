import  { Clock, Truck, MapPin } from 'lucide-react';

export function ServiceHighlights() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Our Delivery Services</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="relative h-40 overflow-hidden">
          <img 
            src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/7b7ceb4e-9cdc-4cbb-68d6-4d5564a70a00/public" 
            alt="White delivery van side view" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center">
            <div className="text-white font-semibold text-center px-2">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <span>On-Time Collection</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-40 overflow-hidden">
          <img 
            src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/1bdf6e9e-0cc1-43ab-a69d-bdd924148700/public" 
            alt="Delivery bike scooter" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center">
            <div className="text-white font-semibold text-center px-2">
              <Truck className="w-8 h-8 mx-auto mb-2" />
              <span>Urgent Delivery Option</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-40 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1595279211419-88239fbff506?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHZhbiUyMFVLJTIwY291cmllciUyMHNlcnZpY2V8ZW58MHx8fHwxNzQzODU1NjY5fDA&ixlib=rb-4.0.3&fit=fillmax&h=300&w=400" 
            alt="British Airways aircraft at airport"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center">
            <div className="text-white font-semibold text-center px-2">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <span>Nationwide Coverage</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50">
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Professional drivers with GPS tracking for all collections and deliveries</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Express collection options with priority service</span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>London collections with specialized service options</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
 