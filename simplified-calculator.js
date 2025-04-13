//  Simplified Delivery Calculator for Webador Integration
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the Google Map
  let map;
  let directionsService;
  let directionsRenderer;
  let markers = [];
  let geocoder;

  // Price settings (can be adjusted as needed)
  const priceSettings = {
    baseRateVan: 3.20,
    baseRateBike: 2.80,
    londonMultiplier: 1.20,
    urgentMultiplier: 1.50,
    vatRate: 0.20,
    bikeDistanceLimit: 30,
    bikeMinimumCharge: 6.50
  };

  // Initialize Google Maps and related services
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 54.7023545, lng: -3.2765753 }, // Center of UK
      zoom: 6
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4361ee',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    geocoder = new google.maps.Geocoder();

    // Initialize autocomplete for postcodes
    initializeAutocomplete('collectionPostcode', 'collectionAddress');
    initializeAutocomplete('deliveryPostcode', 'deliveryAddress');
  }

  function initializeAutocomplete(postcodeField, addressField) {
    const input = document.getElementById(postcodeField);
    if (!input) return;

    const options = {
      componentRestrictions: { country: "gb" },
      types: ["postal_code"]
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.addListener('place_changed', function() {
      handlePostcodeSelected(autocomplete, postcodeField, addressField);
    });
  }

  function handlePostcodeSelected(autocomplete, postcodeField, addressField) {
    const place = autocomplete.getPlace();
    if (!place || !place.address_components) return;

    // Extract address components
    let postcode = '';
    let street = '';
    let city = '';
    let building = '';

    place.address_components.forEach(component => {
      if (component.types.includes("postal_code")) {
        postcode = component.long_name;
      } else if (component.types.includes("route")) {
        street = component.long_name;
      } else if (component.types.includes("locality")) {
        city = component.long_name;
      } else if (component.types.includes("premise") || component.types.includes("street_number")) {
        building = component.long_name;
      }
    });

    // Update address field
    const fullAddress = building ? `${building} ${street}, ${city}` : `${street}, ${city}`;
    document.getElementById(addressField).value = fullAddress;

    // If both postcodes are filled, calculate route
    if (document.getElementById('collectionPostcode').value && 
        document.getElementById('deliveryPostcode').value) {
      calculateRoute();
    }
  }

  function calculateRoute() {
    const collectionPostcode = document.getElementById('collectionPostcode').value;
    const deliveryPostcode = document.getElementById('deliveryPostcode').value;
    const isUrgent = document.getElementById('urgentCheckbox').checked;
    const vehicleType = document.querySelector('input[name="vehicleType"]:checked').value;

    if (!collectionPostcode || !deliveryPostcode || !vehicleType) {
      alert('Please fill in both postcodes and select a vehicle type');
      return;
    }

    // Show loading indicator
    document.getElementById('calculatingIndicator').style.display = 'block';

    // Format addresses for better results
    const originAddress = `${collectionPostcode}, UK`;
    const destinationAddress = `${deliveryPostcode}, UK`;

    directionsService.route({
      origin: originAddress,
      destination: destinationAddress,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidFerries: true,
      region: 'uk'
    }, function(result, status) {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        
        // Get the distance
        const distance = result.routes[0].legs[0].distance.value;
        const miles = distance * 0.000621371; // Convert meters to miles
        
        // Calculate price
        calculatePrice(miles, vehicleType, isUrgent, collectionPostcode, deliveryPostcode);
      } else {
        alert('Could not calculate route. Please check the addresses and try again.');
        document.getElementById('calculatingIndicator').style.display = 'none';
      }
    });
  }

  function calculatePrice(miles, vehicleType, isUrgent, collectionPostcode, deliveryPostcode) {
    // Base rate depends on vehicle type
    const baseRate = vehicleType === 'bike' ? priceSettings.baseRateBike : priceSettings.baseRateVan;
    
    let basePrice = miles * baseRate;

    // Apply vehicle-specific adjustments
    if (vehicleType === 'bike') {
      // Bike delivery has a minimum charge
      basePrice = Math.max(basePrice, priceSettings.bikeMinimumCharge);
      // And a maximum distance cap
      if (miles > priceSettings.bikeDistanceLimit) {
        alert(`Bike delivery is only available for distances under ${priceSettings.bikeDistanceLimit} miles. Please select Van for longer distances.`);
        document.querySelector('input[value="van"]').checked = true;
        // Recalculate with van pricing
        basePrice = miles * priceSettings.baseRateVan;
      }
    }

    if (isUrgent) {
      basePrice *= priceSettings.urgentMultiplier;
    }

    // London postcodes check
    const londonPostcodes = ['EC', 'WC', 'E', 'SE', 'SW', 'W', 'N', 'NW'];
    const collPrefix = collectionPostcode.slice(0, 2).toUpperCase();
    const delPrefix = deliveryPostcode.slice(0, 2).toUpperCase();
    
    if (londonPostcodes.some(prefix => 
      collPrefix.startsWith(prefix) || delPrefix.startsWith(prefix)
    )) {
      basePrice *= priceSettings.londonMultiplier;
    }

    // Format to penny precision
    basePrice = Math.round(basePrice * 100) / 100;
    const vat = Math.round(basePrice * priceSettings.vatRate * 100) / 100;
    const total = Math.round((basePrice + vat) * 100) / 100;

    // Update the UI
    document.getElementById('basePrice').textContent = `£${basePrice.toFixed(2)}`;
    document.getElementById('vatAmount').textContent = `£${vat.toFixed(2)}`;
    document.getElementById('totalPrice').textContent = `£${total.toFixed(2)}`;
    
    // Store values in hidden fields for form submission
    document.getElementById('basePriceInput').value = basePrice.toFixed(2);
    document.getElementById('vatInput').value = vat.toFixed(2);
    document.getElementById('totalPriceInput').value = total.toFixed(2);
    
    // Hide loading indicator
    document.getElementById('calculatingIndicator').style.display = 'none';
    
    // Show the price section
    document.getElementById('priceSection').style.display = 'block';
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    
    // Collect form data
    const formData = {
      collectionName: document.getElementById('collectionName').value,
      collectionAddress: document.getElementById('collectionAddress').value,
      collectionPostcode: document.getElementById('collectionPostcode').value,
      deliveryName: document.getElementById('deliveryName').value,
      deliveryAddress: document.getElementById('deliveryAddress').value,
      deliveryPostcode: document.getElementById('deliveryPostcode').value,
      date: document.getElementById('deliveryDate').value,
      deliveryTime: document.getElementById('deliveryTime').value,
      isUrgent: document.getElementById('urgentCheckbox').checked ? "Yes" : "No",
      vehicleType: document.querySelector('input[name="vehicleType"]:checked').value,
      basePrice: document.getElementById('basePriceInput').value,
      vat: document.getElementById('vatInput').value,
      totalPrice: document.getElementById('totalPriceInput').value,
      contactEmail: document.getElementById('contactEmail').value,
      contactPhone: document.getElementById('contactPhone').value,
      additionalInfo: document.getElementById('additionalInfo').value
    };
    
    // Validate form
    if (!formData.collectionName || !formData.deliveryName || 
        !formData.collectionAddress || !formData.deliveryAddress ||
        !formData.collectionPostcode || !formData.deliveryPostcode ||
        !formData.date || !formData.contactEmail || !formData.contactPhone) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Send data to Google Sheets (if configured)
    if (window.googleSheetsUrl) {
      saveBookingToGoogleSheets(formData);
    } else {
      // For demo purposes
      alert('Booking completed successfully! In a production environment, this would be saved to Google Sheets.');
      console.log('Booking data:', formData);
      document.getElementById('bookingForm').reset();
      document.getElementById('priceSection').style.display = 'none';
    }
  }

  async function saveBookingToGoogleSheets(bookingData) {
    // Replace with your actual Google Sheets Web App URL
    const googleSheetsUrl = window.googleSheetsUrl || 
      "https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec";
    
    try {
      document.getElementById('submitButton').disabled = true;
      document.getElementById('submitButton').textContent = 'Saving...';
      
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      alert('Booking saved successfully!');
      document.getElementById('bookingForm').reset();
      document.getElementById('priceSection').style.display = 'none';
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error saving booking. Please try again later.');
    } finally {
      document.getElementById('submitButton').disabled = false;
      document.getElementById('submitButton').textContent = 'Submit Booking';
    }
  }

  // Set up event listeners
  document.getElementById('calculateButton').addEventListener('click', calculateRoute);
  document.getElementById('bookingForm').addEventListener('submit', handleFormSubmit);
  
  // Initialize the map
  if (typeof google !== 'undefined' && google.maps) {
    initMap();
  } else {
    console.error('Google Maps API not loaded');
  }
});
 