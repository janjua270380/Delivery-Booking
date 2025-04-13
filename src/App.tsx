import  { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { PricingCalculator } from './components/PricingCalculator';
import { Navigation } from './components/Navigation';
import { GoogleSheetIntegrationGuide } from './components/GoogleSheetIntegrationGuide';
import { BookingsTable } from './components/BookingsTable';
import { UserBookings } from './components/UserBookings';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { UserProfile } from './components/UserProfile';
import { updateBookingStatuses } from './utils/storage';

function App() {
  const [showGuide, setShowGuide] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showUserBookings, setShowUserBookings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { isAuthenticated, isAdmin, isWorker, workerPermissions, isLoading } = useAuth();

  // Set up listener for navigation events (simulated routing for demo)
  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail?.path === '/bookings') {
        setShowUserBookings(true);
        setShowGuide(false);
        setShowBookings(false);
        setShowLogin(false);
        setShowRegister(false);
      } else if (event.detail?.path === '/login') {
        setShowLogin(true);
        setShowRegister(false);
        setShowUserBookings(false);
        setShowGuide(false);
        setShowBookings(false);
      } else if (event.detail?.path === '/register') {
        setShowRegister(true);
        setShowLogin(false);
        setShowUserBookings(false);
        setShowGuide(false);
        setShowBookings(false);
      }
    };
    
    window.addEventListener('navigation', handleNavigation);
    
    return () => {
      window.removeEventListener('navigation', handleNavigation);
    };
  }, []);
  
  // Periodically check and update bookings status indicators
  useEffect(() => {
    updateBookingStatuses();
    
    const intervalId = setInterval(() => {
      updateBookingStatuses();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Create a demo booking if none exist
  useEffect(() => {
    // Check if there are any bookings yet
    const existingBookings = localStorage.getItem('deliveryBookings');
    if (!existingBookings || JSON.parse(existingBookings).length === 0) {
      // Create a sample booking for demo purposes
      const sampleBooking = {
        bookingId: "demo123456",
        collectionName: "ABC Shipping Ltd",
        collectionAddress: "123 Commerce Road",
        collectionStreet: "Commerce Road",
        collectionCity: "London",
        collectionCounty: "Greater London",
        collectionBuilding: "123",
        collectionPostcode: "EC1V 1AB",
        deliveryName: "XYZ Industries",
        deliveryAddress: "456 Business Park",
        deliveryStreet: "Business Park",
        deliveryCity: "Manchester",
        deliveryCounty: "Greater Manchester",
        deliveryBuilding: "456",
        deliveryPostcode: "M1 1BB",
        date: new Date().toLocaleDateString("en-GB"),
        deliveryTime: new Date().toLocaleTimeString("en-US", {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isUrgent: "No",
        vehicleType: "van",
        basePrice: "32.50",
        vat: "6.50",
        totalPrice: "39.00",
        userId: "admin1",
        status: "confirmed",
        modifiableUntil: new Date(new Date().getTime() - 1000 * 60 * 10).toLocaleString(),
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60).toLocaleString()
      };

      const bookings = [sampleBooking];
      localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
    }
  }, []);

  const closeAllModals = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowUserProfile(false);
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation 
        onViewBookings={() => {
          if (isAuthenticated) {
            setShowUserBookings(true);
            setShowBookings(false);
            setShowGuide(false);
            setShowLogin(false);
            setShowRegister(false);
          } else {
            setShowLogin(true);
          }
        }} 
        onUserProfile={() => {
          if (isAuthenticated) {
            setShowUserProfile(true);
            setShowBookings(false);
            setShowGuide(false);
            setShowLogin(false);
            setShowRegister(false);
          } else {
            setShowLogin(true);
          }
        }}
        onViewAllBookings={() => {
          setShowBookings(true);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowLogin(false);
          setShowRegister(false);
        }}
        onLogin={() => {
          setShowLogin(true);
          setShowRegister(false);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowBookings(false);
        }}
        onRegister={() => {
          setShowRegister(true);
          setShowLogin(false);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowBookings(false);
        }}
      />
      
      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1520299607509-dcd935f9a839?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxkZWxpdmVyeSUyMHRydWNrJTIwcm91dGUlMjBjYWxjdWxhdGlvbiUyMG1hcHxlbnwwfHx8fDE3NDM3MTcyOTF8MA')" }}>
        </div>
        
        <main className="container mx-auto px-4 py-8 relative">
          {showUserProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <UserProfile onClose={() => setShowUserProfile(false)} />
            </div>
          )}
          
          {showLogin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Login 
                onClose={() => setShowLogin(false)} 
                onRegisterClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              />
            </div>
          )}
          
          {showRegister && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Register 
                onClose={() => setShowRegister(false)} 
                onLoginClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />
            </div>
          )}
          
          {showGuide ? (
            <GoogleSheetIntegrationGuide />
          ) : showBookings ? (
            <BookingsTable onBack={() => setShowBookings(false)} />
          ) : showUserBookings ? (
            <UserBookings onBack={() => setShowUserBookings(false)} />
          ) : (
            // Always show the calculator and map, regardless of authentication status
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PricingCalculator 
                onNeedLogin={() => setShowLogin(true)}
                onNeedRegister={() => setShowRegister(true)}
              />
              <Map />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
 