import  { BookingData, Address, Price } from '../types';

// Add a global property to window for temporary contact info storage
declare global {
  interface Window {
    bookingContactInfo?: {
      email: string;
      phone: string;
    };
    bookingAdditionalInfo?: string;
  }
}

// Function to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Store bookings in local storage for demo purposes
export async function saveBooking(
  booking: {
    collection: Address;
    delivery: Address;
    selectedDate: string;
    isUrgent: boolean;
    vehicleType: 'bike' | 'van';
    price: Price;
    bookingDate: string;
  },
  userId: string
): Promise<string> {
  try {
    console.log('Saving booking data:', booking);
    
    // Create booking ID
    const bookingId = generateId();
    
    // Calculate modifiable until time (30 minutes from now)
    const modifiableUntil = new Date();
    modifiableUntil.setMinutes(modifiableUntil.getMinutes() + 30);
    
    // Get contact info from window or use defaults
    // In a real app we wouldn't use window properties like this
    const contactEmail = window.bookingContactInfo?.email || '';
    const contactPhone = window.bookingContactInfo?.phone || '';
    const additionalInfo = window.bookingAdditionalInfo || '';
    
    // Create the full booking object
    const fullBooking: BookingData = {
      id: bookingId,
      ...booking,
      userId,
      status: 'pending', // All new bookings now start as pending for admin approval
      modifiableUntil: modifiableUntil.toISOString(),
      canModify: true,
      contactEmail,
      contactPhone,
      additionalInfo
    };
    
    // Format data for Google Sheets format
    const formattedData = {
      bookingId: fullBooking.id,
      collectionName: fullBooking.collection.name,
      collectionAddress: fullBooking.collection.address,
      collectionStreet: fullBooking.collection.street || '',
      collectionCity: fullBooking.collection.city || '',
      collectionCounty: fullBooking.collection.county || '',
      collectionBuilding: fullBooking.collection.building || '',
      collectionPostcode: fullBooking.collection.postcode,
      deliveryName: fullBooking.delivery.name,
      deliveryAddress: fullBooking.delivery.address,
      deliveryStreet: fullBooking.delivery.street || '',
      deliveryCity: fullBooking.delivery.city || '',
      deliveryCounty: fullBooking.delivery.county || '',
      deliveryBuilding: fullBooking.delivery.building || '',
      deliveryPostcode: fullBooking.delivery.postcode,
      date: new Date(fullBooking.selectedDate).toLocaleDateString("en-GB"),
      deliveryTime: new Date(fullBooking.selectedDate).toLocaleTimeString("en-US", {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isUrgent: fullBooking.isUrgent ? "Yes" : "No",
      vehicleType: fullBooking.vehicleType,
      basePrice: fullBooking.price.base.toFixed(2),
      vat: fullBooking.price.vat.toFixed(2),
      totalPrice: fullBooking.price.total.toFixed(2),
      userId: fullBooking.userId,
      status: fullBooking.status,
      modifiableUntil: new Date(fullBooking.modifiableUntil).toLocaleString(),
      contactEmail: fullBooking.contactEmail,
      contactPhone: fullBooking.contactPhone,
      additionalInfo: fullBooking.additionalInfo,
      timestamp: new Date().toLocaleString()
    };

    // In a real-world scenario, this would be sent to Google Sheets
    // For JDoodle demo purposes, we'll store it in localStorage
    const existingBookings = localStorage.getItem('deliveryBookings');
    const bookings = existingBookings ? JSON.parse(existingBookings) : [];
    bookings.push(formattedData);
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
    
    console.log('Booking saved successfully in localStorage');
    
    try {
      // Demo Google Sheets API call that would be used in production
      // This shows how it would be integrated with the JDoodle proxy
      // In a real app, this would be your actual Google Apps Script web app URL
      const googleSheetsUrl = "https://script.google.com/macros/s/AKfycbwSYjepyyrpUIc_ewTJ_7d3UTwcN4A2aFo1ww_dW-2c/dev";
      
      console.log('In production, would send to Google Sheets via JDoodle proxy:', formattedData);
      console.log(`Using https://hooks.jdoodle.net/proxy?url=${encodeURIComponent(googleSheetsUrl)}`);
      
      // This is an example of how you'd send data via the JDoodle proxy
      // We're not actually making the request since this is a demo,
      // but if you had a valid Google Apps Script URL, you would use this pattern:
      /*
      const response = await fetch(`https://hooks.jdoodle.net/proxy?url=${encodeURIComponent(googleSheetsUrl)}`, {
        method: 'POST',
        body: JSON.stringify(formattedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Google Sheets response:', result);
      */
    } catch (googleSheetsError) {
      // Log but don't fail the booking since we have a local copy
      console.error('Error sending to Google Sheets (would be handled in production):', googleSheetsError);
    }
    
    // Simulate network delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return bookingId;
  } catch (error) {
    console.error('Error saving booking:', error);
    return Promise.reject(new Error('Failed to save booking. Please try again.'));
  }
}

// Update booking
export async function updateBooking(bookingId: string, updatedData: Partial<BookingData>): Promise<void> {
  try {
    const existingBookings = localStorage.getItem('deliveryBookings');
    if (!existingBookings) return Promise.reject(new Error('No bookings found'));
    
    const bookings = JSON.parse(existingBookings);
    const index = bookings.findIndex((b: any) => b.bookingId === bookingId);
    
    if (index === -1) return Promise.reject(new Error('Booking not found'));
    
    // Update the booking without checking modifiable window
    // This allows admins and users to cancel bookings at any time
    bookings[index] = {
      ...bookings[index],
      ...updatedData,
      // Update timestamp
      timestamp: new Date().toLocaleString()
    };
    
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error updating booking:', error);
    return Promise.reject(new Error('Failed to update booking. Please try again.'));
  }
}

// Get all bookings
export function getAllBookings(): Array<any> {
  const existingBookings = localStorage.getItem('deliveryBookings');
  return existingBookings ? JSON.parse(existingBookings) : [];
}

// Get bookings (alias for getAllBookings, to match expected API)
export function getBookings(): Array<any> {
  return getAllBookings();
}

// Get user bookings
export function getUserBookings(userId: string): Array<any> {
  const allBookings = getAllBookings();
  return allBookings.filter((booking: any) => booking.userId === userId);
}

// Get booking by ID
export function getBookingById(bookingId: string): any {
  const allBookings = getAllBookings();
  return allBookings.find((booking: any) => booking.bookingId === bookingId);
}

// Check and update booking modifiable status
// This will only update the UI indication but won't prevent cancellation
export function updateBookingStatuses(): void {
  const existingBookings = localStorage.getItem('deliveryBookings');
  if (!existingBookings) return;
  
  const bookings = JSON.parse(existingBookings);
  const now = new Date();
  let updated = false;
  
  bookings.forEach((booking: any) => {
    const modifiableUntil = new Date(booking.modifiableUntil);
    
    // If the booking was modifiable and the time has passed
    // Note: Now only confirmed bookings auto-progress to the next stage
    // Pending bookings need admin approval
    if (booking.status === 'confirmed' && now > modifiableUntil) {
      booking.canModify = false; // This only affects UI, not functionality
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
  }
}
 