import  { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building, Mail, LogOut, AlertCircle, Shield, Phone, Save, Users } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout, updateUserProfile, isAdmin, isWorker, workerPermissions } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
      onClose();
    }, 500);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      company: user?.company || '',
      phone: user?.phone || ''
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!editedUser.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!editedUser.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!editedUser.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserProfile({
        name: editedUser.name,
        email: editedUser.email,
        company: editedUser.company,
        phone: editedUser.phone
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img 
            src={user.avatar || `https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453`}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover mx-auto"
          />
          <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
          
          {user.isAdmin && (
            <div className="absolute -top-2 -right-2 bg-green-600 text-white p-1 rounded-full border-2 border-white">
              <Shield className="w-5 h-5" />
            </div>
          )}
          
          {user.isWorker && (
            <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-1 rounded-full border-2 border-white">
              <Users className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {!isEditing ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 mt-4">{user.name}</h2>
            
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                {user.email}
              </div>
              
              {user.isAdmin && (
                <div className="flex items-center text-green-600 font-medium">
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </div>
              )}
              
              {user.isWorker && (
                <div className="flex items-center text-purple-600 font-medium">
                  <Users className="w-4 h-4 mr-1" />
                  Worker
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-3 text-left">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 07700 900123"
                value={editedUser.phone}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company (Optional)
              </label>
              <input
                id="company"
                type="text"
                value={editedUser.company}
                onChange={(e) => setEditedUser({ ...editedUser, company: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      <div className="mt-6 space-y-4">
        {!isEditing && (
          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Company:</p>
                <p className="font-medium text-gray-800">{user.company || 'Personal Account'}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Phone:</p>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-600" />
                  {user.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isWorker && workerPermissions && (
          <div className="bg-purple-50 p-4 rounded-md space-y-3">
            <h3 className="font-medium text-purple-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Worker Permissions
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${workerPermissions.viewCustomers ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={workerPermissions.viewCustomers ? 'text-gray-800' : 'text-gray-500'}>
                  View Customers and Bookings
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${workerPermissions.manageBookings ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={workerPermissions.manageBookings ? 'text-gray-800' : 'text-gray-500'}>
                  Manage Bookings (Accept/Decline/Outsource)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${workerPermissions.viewPricing ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={workerPermissions.viewPricing ? 'text-gray-800' : 'text-gray-500'}>
                  View Pricing Settings
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${workerPermissions.managePricing ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={workerPermissions.managePricing ? 'text-gray-800' : 'text-gray-500'}>
                  Manage Pricing Settings
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            Account Information
          </h3>
          
          <p className="text-sm text-blue-700">
            {isEditing ? 'Update your contact information to ensure you receive important notifications about your deliveries.' :
            'This is your account profile. Your contact information will be used for delivery notifications and updates.'}
            {user.isAdmin && (
              <span className="block mt-2 font-medium">
                As an admin, you have full access to all system features and user management.
              </span>
            )}
            {user.isWorker && (
              <span className="block mt-2 font-medium">
                As a worker, you have access to specific features assigned by the administrator.
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50"
            >
              Close
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </button>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:bg-red-400"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
 