import  { useState, useEffect } from 'react';
import { getBookings, updateBooking } from '../utils/storage';
import { AdminJobManagement } from './AdminJobManagement';
import { Database, Eye, EyeOff, ArrowLeft, Download, Shield, CheckCircle, Clock, XCircle, Edit, User, Bike, Truck, Sliders, Search, Trash2, RefreshCw, Users } from 'lucide-react';
import { AdminCustomersList } from './AdminCustomersList';
import { AdminPriceControls } from './AdminPriceControls';
import { AdminUserControls } from './AdminUserControls';
import { BookingDetails } from './BookingDetails';
import { useAuth } from '../context/AuthContext';

interface BookingsTableProps {
  onBack: () => void;
}

export function BookingsTable({ onBack }: BookingsTableProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [viewBookingDetails, setViewBookingDetails] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{success?: string, error?: string} | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showUserControls, setShowUserControls] = useState(false);
  const [showPriceControls, setShowPriceControls] = useState(false);
  const [showJobManagement, setShowJobManagement] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const { isAdmin, isWorker, workerPermissions } = useAuth();
  
  useEffect(() => {
    loadBookings();
  }, []);
  
  // Get all bookings from localStorage
  const loadBookings = () => {
    setLoading(true);
    const allBookings = getBookings();
    setBookings(allBookings);
    setLoading(false);
  };
  
  // Filter by search term and status
  const filteredBookings = bookings.filter(booking => {
    // First filter by search term
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (booking.collectionName && booking.collectionName.toLowerCase().includes(searchLower)) ||
      (booking.deliveryName && booking.deliveryName.toLowerCase().includes(searchLower)) ||
      (booking.collectionPostcode && booking.collectionPostcode.toLowerCase().includes(searchLower)) ||
      (booking.deliveryPostcode && booking.deliveryPostcode.toLowerCase().includes(searchLower)) ||
      (booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower));
    
    // Then filter by status if needed
    if (filter === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && booking.status === filter;
    }
  });
  
  // Sort bookings based on current sort field and direction
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Special handling for dates
    if (sortField === 'timestamp' || sortField === 'modifiableUntil') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const displayBookings = showAll ? sortedBookings : sortedBookings.slice(0, 10);
  
  // Function to export bookings as CSV
  const exportCSV = () => {
    if (bookings.length === 0) return;
    
    // Get all keys from the first booking for headers
    const headers = Object.keys(bookings[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    bookings.forEach(booking => {
      const row = headers.map(header => {
        // Handle values that might contain commas by wrapping in quotes
        let cell = booking[header] || '';
        cell = cell.toString().replace(/"/g, '""'); // Escape quotes
        return `"${cell}"`;
      }).join(',');
      csvContent += row + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'delivery_bookings.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };
  
  // Function to handle booking status update
  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      await updateBooking(bookingId, { status: newStatus });
      setUpdateStatus({ success: `Booking successfully updated to ${newStatus}` });
      
      // Update the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, status: newStatus } 
            : booking
        )
      );
    } catch (error) {
      setUpdateStatus({ error: `Failed to update booking: ${(error as Error).message}` });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Function to handle booking deletion
  const handleDeleteBooking = async (bookingId: string) => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      // Get the current bookings
      const currentBookings = getBookings();
      
      // Filter out the booking to delete
      const updatedBookings = currentBookings.filter(booking => booking.bookingId !== bookingId);
      
      // Save back to localStorage
      localStorage.setItem('deliveryBookings', JSON.stringify(updatedBookings));
      
      // Update the local state
      setBookings(updatedBookings);
      
      setUpdateStatus({ success: 'Booking successfully deleted' });
    } catch (error) {
      setUpdateStatus({ error: `Failed to delete booking: ${(error as Error).message}` });
    } finally {
      setIsUpdating(false);
      setShowConfirmDelete(null);
    }
  };
  
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-purple-100 text-purple-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'outsourced':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-indigo-100 text-indigo-800">
            <CheckCircle className="w-3 h-3" />
            Outsourced
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-orange-100 text-orange-800">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Function to extract time from date 
  const extractTimeFromDate = (dateString: string) => {
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Return time in 12-hour format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      // If there's an error parsing the date, just return the original string
      return dateString;
    }
  };

  if (showCustomers) {
    return <AdminCustomersList onBack={() => setShowCustomers(false)} />;
  }

  if (showUserControls) {
    return <AdminUserControls onBack={() => setShowUserControls(false)} />;
  }

  if (showPriceControls) {
    return <AdminPriceControls onBack={() => setShowPriceControls(false)} />;
  }

  if (showJobManagement) {
    return <AdminJobManagement onBack={() => setShowJobManagement(false)} />;
  }

  if (viewBookingDetails) {
    const booking = bookings.find(b => b.bookingId === viewBookingDetails);
    if (!booking) return null;
    
    return (
      <BookingDetails 
        bookingId={viewBookingDetails}
        booking={booking}
        onBack={() => setViewBookingDetails(null)}
        onRefresh={loadBookings}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {isAdmin ? (
              <>
                <Shield className="w-6 h-6 text-green-600" />
                Admin Dashboard
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-purple-600" />
                Worker Dashboard
              </>
            )}
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Admin-only buttons */}
          {isAdmin && (
            <>
              <button
                onClick={() => setShowJobManagement(true)}
                className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white hover:bg-green-700 rounded-md"
              >
                <Truck className="w-4 h-4" />
                Job Management
              </button>
              
              <button
                onClick={() => setShowPriceControls(true)}
                className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white hover:bg-green-700 rounded-md"
              >
                <Sliders className="w-4 h-4" />
                Pricing Controls
              </button>

              <button
                onClick={() => setShowUserControls(true)}
                className="flex items-center gap-1 text-sm py-1 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                <User className="w-4 h-4" />
                User Management
              </button>
              
              <button
                onClick={() => setShowCustomers(true)}
                className="flex items-center gap-1 text-sm py-1 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                <Database className="w-4 h-4" />
                Customer List
              </button>
            </>
          )}
          
          {/* Worker buttons based on permissions */}
          {isWorker && workerPermissions && (
            <>
              {workerPermissions.manageBookings && (
                <button
                  onClick={() => setShowJobManagement(true)}
                  className="flex items-center gap-1 text-sm py-1 px-3 bg-purple-600 text-white hover:bg-purple-700 rounded-md"
                >
                  <Truck className="w-4 h-4" />
                  Job Management
                </button>
              )}
              
              {workerPermissions.viewPricing && (
                <button
                  onClick={() => setShowPriceControls(true)}
                  className="flex items-center gap-1 text-sm py-1 px-3 bg-purple-600 text-white hover:bg-purple-700 rounded-md"
                >
                  <Sliders className="w-4 h-4" />
                  View Pricing
                </button>
              )}
              
              {workerPermissions.viewCustomers && (
                <button
                  onClick={() => setShowCustomers(true)}
                  className="flex items-center gap-1 text-sm py-1 px-3 bg-purple-600 text-white hover:bg-purple-700 rounded-md"
                >
                  <Database className="w-4 h-4" />
                  Customer List
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                loadBookings();
              }, 500);
            }}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={exportCSV}
            disabled={bookings.length === 0}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white hover:bg-green-700 rounded-md disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Database className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Bookings Dashboard</p>
            <p className="text-sm mt-1">
              {isAdmin ? (
                "Enhanced admin controls allow you to manage all bookings and customer accounts. Use the job management feature to approve, decline, or outsource customer bookings."
              ) : (
                `As a worker, you have access to specific features assigned by the administrator. 
                 You can ${workerPermissions?.viewCustomers ? 'view customer information' : ''} 
                 ${workerPermissions?.manageBookings ? (workerPermissions?.viewCustomers ? 'and' : '') + ' manage bookings' : ''}.`
              )}
            </p>
          </div>
        </div>
      </div>
      
      {updateStatus && (
        <div className={`p-3 rounded-md ${updateStatus.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <p className="text-sm">{updateStatus.error || updateStatus.success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name, postcode, or booking ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="col-span-1">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending Only</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="outsourced">Outsourced Only</option>
            <option value="declined">Declined Only</option>
            <option value="completed">Completed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
        
        <div className="col-span-1">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 flex-1 text-sm py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAll ? 'Show Less' : 'Show All'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Booking?</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to permanently delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-10">
          <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No bookings saved yet</p>
          <p className="text-sm text-gray-400 mt-1">
            When clients make bookings, they will appear here
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp {renderSortIndicator('timestamp')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('vehicleType')}
                >
                  Vehicle {renderSortIndicator('vehicleType')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('collectionName')}
                >
                  Collection {renderSortIndicator('collectionName')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('deliveryName')}
                >
                  Delivery {renderSortIndicator('deliveryName')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  Collection Date & Time {renderSortIndicator('date')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status {renderSortIndicator('status')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('totalPrice')}
                >
                  Total {renderSortIndicator('totalPrice')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayBookings.length > 0 ? (
                displayBookings.map((booking, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {booking.vehicleType === 'bike' ? (
                          <Bike className="w-4 h-4 text-blue-600 mr-1" />
                        ) : (
                          <Truck className="w-4 h-4 text-blue-600 mr-1" />
                        )}
                        {booking.vehicleType === 'bike' ? 'Bike' : 'Van'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.collectionName}</div>
                      <div className="text-sm text-gray-500">{booking.collectionPostcode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.deliveryName}</div>
                      <div className="text-sm text-gray-500">{booking.deliveryPostcode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.date}
                      <div className="text-xs text-blue-600">
                        {extractTimeFromDate(booking.deliveryTime || booking.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status || (booking.isUrgent === 'Yes' ? 'urgent' : 'standard'))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      £{booking.totalPrice}
                      {booking.isUrgent === 'Yes' && (
                        <span className="text-xs text-amber-600 block mt-1">Urgent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setViewBookingDetails(booking.bookingId)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View booking details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setViewBookingDetails(booking.bookingId)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit booking"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => setShowConfirmDelete(booking.bookingId)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete booking"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {isWorker && workerPermissions?.manageBookings && (
                          <button
                            onClick={() => setViewBookingDetails(booking.bookingId)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Manage booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No bookings match your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {displayBookings.length} of {filteredBookings.length} bookings
        {searchTerm && ` (filtered from ${bookings.length} total)`}
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
        
        <button
          onClick={exportCSV}
          disabled={bookings.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          <Download className="w-4 h-4" />
          Export to Excel/CSV
        </button>
      </div>
    </div>
  );
}
 