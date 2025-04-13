import  { useEffect, useState, useRef } from 'react';
import { useMap } from '../context/MapContext';
import { AlertCircle, MapPin, User, Home, Truck, Building, ArrowRight, Calendar, Clock } from 'lucide-react';
import { ConfirmationPage } from './ConfirmationPage';
import { saveBooking } from '../utils/storage';
import { SuccessMessage } from './SuccessMessage';
import { useAuth } from '../context/AuthContext';
import { Address, Price } from '../types';
import { VehicleSelector } from './VehicleSelector';
import { InlineCalendar } from './InlineCalendar';

interface PricingCalculatorProps {
  onNeedLogin: () => void;
  onNeedRegister: () => void;
}

export function PricingCalculator({ onNeedLogin, onNeedRegister }: PricingCalculatorProps) {
  const [collection, setCollection] = useState<Address>({ 
    name: '', 
    address: '', 
    street: '',
    city: '',
    town: '',
    county: '',
    building: '',
    postcode: '' 
  });
  
  const [delivery, setDelivery] = useState<Address>({ 
    name: '', 
    address: '', 
    street: '',
    city: '',
    town: '',
    county: '',
    building: '',
    postcode: '' 
  });
  
  const [price, setPrice] = useState<Price>({ base: 0, vat: 0, total: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [vehicleType, setVehicleType] = useState<'bike' | 'van' | null>(null);
  
  // For price configuration
  const [priceSettings, setPriceSettings] = useState({
    baseRateVan: 3.20,
    baseRateBike: 2.80,
    londonMultiplier: 1.20,
    urgentMultiplier: 1.50,
    vatRate: 0.20,
    bikeDistanceLimit: 30,
    bikeMinimumCharge: 6.50
  });
  
  // For autocomplete setup
  const collectionPostcodeRef = useRef<HTMLInputElement>(null);
  const deliveryPostcodeRef = useRef<HTMLInputElement>(null);
  
  const autocompleteCollectionPostcode = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteDeliveryPostcode = useRef<google.maps.places.Autocomplete | null>(null);

  const { calculateRoute } = useMap();
  const { user, isAuthenticated } = useAuth();

  // Load price settings from localStorage
  useEffect(() => {
    const storedPrices = localStorage.getItem('deliveryPrices');
    if (storedPrices) {
      setPriceSettings(JSON.parse(storedPrices));
    }
  }, []);

  // Initialize Google Maps Places Autocomplete for postcodes
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        // For postcodes
        if (collectionPostcodeRef.current) {
          autocompleteCollectionPostcode.current = new google.maps.places.Autocomplete(
            collectionPostcodeRef.current,
            { 
              componentRestrictions: { country: "gb" },
              types: ["postal_code"]
            }
          );
          
          autocompleteCollectionPostcode.current.addListener("place_changed", () => {
            handlePostcodeSelected('collection');
          });
        }
        
        if (deliveryPostcodeRef.current) {
          autocompleteDeliveryPostcode.current = new google.maps.places.Autocomplete(
            deliveryPostcodeRef.current,
            { 
              componentRestrictions: { country: "gb" },
              types: ["postal_code"]
            }
          );
          
          autocompleteDeliveryPostcode.current.addListener("place_changed", () => {
            handlePostcodeSelected('delivery');
          });
        }
      } catch (e) {
        console.error("Error initializing Google Places Autocomplete:", e);
      }
    } else {
      console.warn("Google Maps Places API not available");
    }
  }, []);

  // Handle postcode selection
  const handlePostcodeSelected = (type: 'collection' | 'delivery') => {
    try {
      const autocomplete = type === 'collection' 
        ? autocompleteCollectionPostcode.current 
        : autocompleteDeliveryPostcode.current;
      
      if (!autocomplete) return;
      
      const place = autocomplete.getPlace();
      if (!place || !place.address_components) return;
      
      // Extract postcode and other address components
      let postcode = '';
      let street = '';
      let city = '';
      let town = '';
      let county = '';
      let building = '';
      
      // Extract components
      place.address_components.forEach(component => {
        if (component.types.includes("postal_code")) {
          postcode = component.long_name;
        } else if (component.types.includes("route")) {
          street = component.long_name;
        } else if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("postal_town")) {
          town = component.long_name;
        } else if (component.types.includes("administrative_area_level_2")) {
          county = component.long_name;
        } else if (component.types.includes("premise") || component.types.includes("street_number")) {
          building = component.long_name;
        }
      });
      
      // If no street was found but we have a formatted address, extract a reasonable value
      if (!street && place.formatted_address) {
        const parts = place.formatted_address.split(',');
        if (parts.length > 1) {
          // The first part might be the street or building+street
          street = parts[0].trim();
        }
      }
      
      // Create a copy of the current state to modify
      const updatedAddress = type === 'collection' ? {...collection} : {...delivery};
      
      // Update only address-related fields, preserving the name
      updatedAddress.postcode = postcode;
      updatedAddress.address = building ? `${building} ${street}`.trim() : street;
      updatedAddress.street = street;
      updatedAddress.city = city;
      updatedAddress.town = town;
      updatedAddress.county = county;
      updatedAddress.building = building;
      
      // Update state with the modified copy
      if (type === 'collection') {
        setCollection(updatedAddress);
      } else {
        setDelivery(updatedAddress);
      }

      // If we have completed both addresses, calculate the price
      if (type === 'collection' && delivery.postcode && vehicleType) {
        calculatePrice();
      } else if (type === 'delivery' && collection.postcode && vehicleType) {
        calculatePrice();
      }
    } catch (e) {
      console.error("Error handling postcode selection:", e);
    }
  };

  const calculatePrice = async () => {
    if (!vehicleType) return;
    
    setIsCalculating(true);
    setError('');

    try {
      // If we don't have both postcodes, use default distances for estimate
      if (!collection.postcode || !delivery.postcode) {
        // Default pricing based on vehicle type
        let basePrice = vehicleType === 'bike' 
          ? priceSettings.bikeMinimumCharge 
          : 25 * priceSettings.baseRateVan; // Assume 25 miles for default van rate
        
        if (isUrgent) {
          basePrice *= priceSettings.urgentMultiplier;
        }
        
        // Format to penny precision
        basePrice = Math.round(basePrice * 100) / 100;
        const vat = Math.round(basePrice * priceSettings.vatRate * 100) / 100;
        const total = Math.round((basePrice + vat) * 100) / 100;
        
        setPrice({
          base: basePrice,
          vat: vat,
          total: total
        });
        
        setIsCalculating(false);
        return;
      }
      
      // Properly format addresses for better results
      const formatAddress = (addr: Address) => {
        const parts = [];
        
        if (addr.building) parts.push(addr.building);
        if (addr.address) parts.push(addr.address);
        if (addr.city) parts.push(addr.city);
        if (addr.town && addr.town !== addr.city) parts.push(addr.town);
        
        // Add UK if not already mentioned
        const addressStr = parts.join(', ');
        if (!addressStr.toLowerCase().includes('uk') && 
            !addressStr.toLowerCase().includes('united kingdom')) {
          return `${addressStr}, ${addr.postcode}, UK`;
        }
        
        return `${addressStr}, ${addr.postcode}`;
      };
      
      const collectionAddress = formatAddress(collection);
      const deliveryAddress = formatAddress(delivery);
      
      // In case only postcodes are available
      const fallbackCollectionAddress = collection.postcode + ", UK";
      const fallbackDeliveryAddress = delivery.postcode + ", UK";
      
      // Try with full address first
      let distance = 0;
      try {
        distance = await calculateRoute(collectionAddress, deliveryAddress);
      } catch (err) {
        console.warn('Error with full addresses, trying with postcodes only:', err);
        try {
          // Fallback to postcodes only
          distance = await calculateRoute(fallbackCollectionAddress, fallbackDeliveryAddress);
        } catch (postcodeErr) {
          console.error('Error with postcode addresses:', postcodeErr);
          // Continue with distance=0, we'll use default pricing below
        }
      }

      if (distance === 0) {
        console.warn('Could not calculate exact route, using estimated pricing');
        // Instead of showing an error, we'll proceed with default pricing
        // This ensures a better user experience even if route calculation fails
      }

      const miles = distance * 0.000621371;
      // Base rate depends on vehicle type and settings from admin
      const baseRate = vehicleType === 'bike' ? priceSettings.baseRateBike : priceSettings.baseRateVan;
      
      // If distance is 0 (calculation failed), use an estimated distance
      const estimatedMiles = 25; // A reasonable assumption for UK delivery
      let basePrice = miles > 0 ? miles * baseRate : estimatedMiles * baseRate;

      // Apply vehicle-specific adjustments
      if (vehicleType === 'bike') {
        // Bike delivery has a minimum charge
        basePrice = Math.max(basePrice, priceSettings.bikeMinimumCharge);
        // And a maximum distance cap
        if (miles > priceSettings.bikeDistanceLimit) {
          setError(`Bike delivery is only available for distances under ${priceSettings.bikeDistanceLimit} miles. Please select Delivery Van for longer distances.`);
          setVehicleType('van');
          // Recalculate with van pricing
          basePrice = miles * priceSettings.baseRateVan;
        }
      }

      if (isUrgent) {
        basePrice *= priceSettings.urgentMultiplier;
      }

      // London postcodes check
      const londonPostcodes = ['EC', 'WC', 'E', 'SE', 'SW', 'W', 'N', 'NW'];
      const collPrefix = collection.postcode?.slice(0, 2).toUpperCase() || '';
      const delPrefix = delivery.postcode?.slice(0, 2).toUpperCase() || '';
      
      if (londonPostcodes.some(prefix => 
        collPrefix.startsWith(prefix) || delPrefix.startsWith(prefix)
      )) {
        basePrice *= priceSettings.londonMultiplier;
      }

      // Format to penny precision
      basePrice = Math.round(basePrice * 100) / 100;
      const vat = Math.round(basePrice * priceSettings.vatRate * 100) / 100;
      const total = Math.round((basePrice + vat) * 100) / 100;

      setPrice({
        base: basePrice,
        vat: vat,
        total: total
      });
    } catch (err) {
      console.error('Calculation error:', err);
      // Don't show error to user, instead set a default price
      const estimatedMiles = 25; // A reasonable assumption for UK delivery
      const baseRate = vehicleType === 'bike' ? priceSettings.baseRateBike : priceSettings.baseRateVan;
      let basePrice = estimatedMiles * baseRate;
      
      if (isUrgent) {
        basePrice *= priceSettings.urgentMultiplier;
      }
      
      // Format to penny precision
      basePrice = Math.round(basePrice * 100) / 100;
      const vat = Math.round(basePrice * priceSettings.vatRate * 100) / 100;
      const total = Math.round((basePrice + vat) * 100) / 100;
      
      setPrice({
        base: basePrice,
        vat: vat,
        total: total
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Update prices when vehicle type is selected
  useEffect(() => {
    if (vehicleType) {
      calculatePrice();
    }
  }, [vehicleType]);
  
  // Update price when urgent flag changes
  useEffect(() => {
    // If vehicle type is selected, recalculate with the urgency flag
    if (vehicleType) {
      calculatePrice();
    }
  }, [isUrgent]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      setError('Please select a date and time for your collection');
      return;
    }
    
    // Check if user is logged in before proceeding to confirmation
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      // Set the time on the selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, minutes);
      setSelectedDate(dateWithTime);
      
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !user || !vehicleType) return;
    
    setIsSaving(true);
    setError('');
    
    // Add time to date if not already set
    let dateWithTime = selectedDate;
    if (selectedDate.getHours() === 0 && selectedDate.getMinutes() === 0) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, minutes);
    }
    
    const bookingData = {
      collection,
      delivery,
      selectedDate: dateWithTime.toISOString(),
      isUrgent,
      vehicleType,
      price,
      bookingDate: new Date().toISOString()
    };

    try {
      const id = await saveBooking(bookingData, user.id);
      setBookingId(id);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Error saving booking. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCollection({ 
      name: '', 
      address: '', 
      street: '',
      city: '',
      town: '',
      county: '',
      building: '',
      postcode: '' 
    });
    setDelivery({ 
      name: '', 
      address: '', 
      street: '',
      city: '',
      town: '',
      county: '',
      building: '',
      postcode: '' 
    });
    setSelectedDate(null);
    setSelectedTime('12:00');
    setIsUrgent(false);
    setVehicleType(null);
    setShowConfirmation(false);
    setBookingSuccess(false);
    setError('');
    setBookingId('');
    setPrice({ base: 0, vat: 0, total: 0 });
  };

  if (bookingSuccess) {
    return <SuccessMessage onReset={resetForm} bookingId={bookingId} vehicleType={vehicleType} />;
  }

  if (showConfirmation && selectedDate) {
    return (
      <ConfirmationPage
        collection={collection}
        delivery={delivery}
        price={price}
        selectedDate={selectedDate}
        isUrgent={isUrgent}
        vehicleType={vehicleType}
        onIsUrgentChange={(value) => setIsUrgent(value)}
        onBack={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        isSaving={isSaving}
        error={error}
      />
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Create an Account to Continue
        </h2>
        
        <div className="bg-blue-50 p-5 rounded-lg">
          <p className="text-gray-700 mb-4">
            You need to be logged in to complete your booking. Please create an account or log in to continue.
          </p>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={onNeedLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Log In
            </button>
            
            <button
              onClick={onNeedRegister}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Create Account
            </button>
          </div>
          
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Delivery Details
        </h2>
        
        <div className="space-y-5">
          {/* Vehicle type selector */}
          <VehicleSelector 
            selectedVehicle={vehicleType}
            onVehicleSelect={setVehicleType}
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Collection Details
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="House Number / Name"
                  value={collection.name}
                  onChange={e => setCollection(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="First Line of Address"
                  value={collection.address}
                  onChange={e => setCollection(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City"
                    value={collection.city}
                    onChange={e => setCollection(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Town"
                    value={collection.town}
                    onChange={e => setCollection(prev => ({ ...prev, town: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={collectionPostcodeRef}
                  type="text"
                  placeholder="Enter Postcode (e.g. SW1A 1AA)"
                  value={collection.postcode}
                  onChange={e => {
                    setCollection(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }));
                    if (vehicleType) calculatePrice();
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Delivery Details
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="House Number / Name"
                  value={delivery.name}
                  onChange={e => setDelivery(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="First Line of Address"
                  value={delivery.address}
                  onChange={e => setDelivery(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City"
                    value={delivery.city}
                    onChange={e => setDelivery(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Town"
                    value={delivery.town}
                    onChange={e => setDelivery(prev => ({ ...prev, town: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={deliveryPostcodeRef}
                  type="text"
                  placeholder="Enter Postcode (e.g. M1 1BB)"
                  value={delivery.postcode}
                  onChange={e => {
                    setDelivery(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }));
                    if (vehicleType) calculatePrice();
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          {/* Inline Calendar */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Collection Date & Time
            </h3>
            
            <InlineCalendar 
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              selectedTime={selectedTime}
              onTimeChange={handleTimeChange}
            />

            <div className="mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="urgent" className="text-sm font-medium text-gray-700">
                  Urgent Delivery
                </label>
              </div>
            </div>
          </div>

          {/* Price display - moved below the calendar */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <img 
                src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb25leSUyMGNhbGN1bGF0b3IlMjBwb3VuZHMlMjBicml0aXNoJTIwcHJpY2luZ3xlbnwwfHx8fDE3NDQyMTkyMTh8MA"
                alt="Money with calculator"
                className="w-5 h-5 object-cover rounded-full"
              />
              Delivery Price
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Base Price:</p>
                <p className="text-lg font-semibold">
                  {vehicleType 
                    ? `£${price.base.toFixed(2)}` 
                    : "£0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT ({(priceSettings.vatRate * 100).toFixed(1)}%):</p>
                <p className="text-lg font-semibold">
                  {vehicleType 
                    ? `£${price.vat.toFixed(2)}` 
                    : "£0.00"}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">Total:</p>
              <p className="text-xl font-bold text-green-700">
                {vehicleType 
                  ? `£${price.total.toFixed(2)}` 
                  : "£0.00"}
              </p>
            </div>
            {isCalculating && (
              <div className="text-center py-2 mt-2">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"></div>
                <p className="text-xs text-gray-600 mt-1">Calculating price...</p>
              </div>
            )}
            {vehicleType && (collection.postcode || delivery.postcode) && (
              <div className="mt-2 text-xs text-gray-500">
                <p>* Prices will be updated as you enter postcodes</p>
                {isUrgent && <p>* Urgent delivery surcharge applied</p>}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleBookNow}
          disabled={!collection.address || !delivery.address || !collection.postcode || !delivery.postcode || !collection.name || !delivery.name || !vehicleType || !selectedDate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
 