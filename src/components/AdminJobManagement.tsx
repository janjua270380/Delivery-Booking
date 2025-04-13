import  { useState, useEffect } from 'react';
import { 
  ArrowLeft, Truck, Bike, CheckCircle, XCircle, ExternalLink, Calendar, 
  Clock, MapPin, RefreshCw, Search, Filter, AlertTriangle, Mail, Phone, 
  User, FileText, Check, X, Loader, Shield, Users 
} from 'lucide-react';
import { getAllBookings, updateBooking } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

interface AdminJobManagementProps {
  onBack: () => void;
}

export function AdminJobManagement({ onBack }: AdminJobManagementProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [updateStatus, setUpdateStatus] = useState<{success?: string, error?: string} | null>(null);
  const [showOutsourceForm, setShowOutsourceForm] = useState(false);
  const [outsourceData, setOutsourceData] = useState({
    bookingId: '',
    partnerName: '',
    partnerEmail: '',
    partnerPhone: '',
    notes: ''
  });
  
  const { isAdmin, isWorker } = useAuth();
  
  // Load all bookings from localStorage
  useEffect(() => {
    loadBookings();
  }, []);
  
  // Filter bookings based on selected filter and search term
  useEffect(() => {
    let filtered = bookings;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.collectionName && booking.collectionName.toLowerCase().includes(term)) ||
        (booking.deliveryName && booking.deliveryName.toLowerCase().includes(term)) ||
        (booking.collectionPostcode && booking.collectionPostcode.toLowerCase().includes(term)) ||
        (booking.deliveryPostcode && booking.deliveryPostcode.toLowerCase().includes(term)) ||
        (booking.bookingId && booking.bookingId.toLowerCase().includes(term))
      );
    }
    
    // Sort the filtered bookings
    filtered = [...filtered].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Special handling for dates
      if (sortField === 'timestamp' || sortField === 'modifiableUntil') {
        valueA = new Date(valueA || 0).getTime();
        valueB = new Date(valueB || 0).getTime();
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredBookings(filtered);
  }, [bookings, filter, searchTerm, sortField, sortDirection]);
  
  const loadBookings = () => {
    setLoading(true);
    setTimeout(() => {
      const allBookings = getAllBookings();
      setBookings(allBookings);
      setLoading(false);
    }, 500); // Simulate network delay for demo
  };
  
  // Handle booking status update
  const handleJobAction = async (bookingId: string, newStatus: string, outsourceInfo?: any) => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      let updateData: any = { status: newStatus };
      
      // If outsourcing, add the partner info
      if (newStatus === 'outsourced' && outsourceInfo) {
        updateData.outsourcedTo = outsourceInfo.partnerName;
        updateData.outsourcedEmail = outsourceInfo.partnerEmail;
        updateData.outsourcedPhone = outsourceInfo.partnerPhone;
        updateData.outsourcedNotes = outsourceInfo.notes;
        updateData.outsourcedAt = new Date().toISOString();
      }
      
      // Add admin notes for declined jobs
      if (newStatus === 'declined' && outsourceInfo?.notes) {
        updateData.declineReason = outsourceInfo.notes;
        updateData.declinedAt = new Date().toISOString();
      }
      
      await updateBooking(bookingId, updateData);
      
      // Update the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, ...updateData } 
            : booking
        )
      );
      
      setUpdateStatus({ 
        success: `Booking ${bookingId.substring(0, 8)} has been ${newStatus}` +
          (newStatus === 'outsourced' ? ` to ${outsourceInfo.partnerName}` : '')
      });
      
      // Clear selected booking and outsource form
      setSelectedBooking(null);
      setShowOutsourceForm(false);
      setOutsourceData({
        bookingId: '',
        partnerName: '',
        partnerEmail: '',
        partnerPhone: '',
        notes: ''
      });
      
    } catch (error) {
      setUpdateStatus({ error: `Failed to update booking: ${(error as Error).message}` });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'outsourced':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-purple-100 text-purple-800">
            <ExternalLink className="w-3 h-3" />
            Outsourced
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Completed
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
  
  // Handle sorting of columns
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Function to render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };
  
  const bookingSelected = bookings.find(b => b.bookingId === selectedBooking);
  
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
                Job Management
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-purple-600" />
                Job Management
              </>
            )}
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadBookings}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {updateStatus && (
        <div className={`p-4 rounded-md ${updateStatus.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} flex items-center gap-2`}>
          {updateStatus.error ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{updateStatus.error || updateStatus.success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, postcode, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending Approval</option>
            <option value="confirmed">Approved</option>
            <option value="outsourced">Outsourced</option>
            <option value="declined">Declined</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="hidden md:block">
            <div className="w-24 h-24 rounded-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1605882174146-a464b70cf691?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxkZWxpdmVyeSUyMGNvdXJpZXIlMjBzZXJ2aWNlJTIwbG9naXN0aWNzJTIwYXBwcm92YWwlMjBhZG1pbiUyMGRhc2hib2FyZHxlbnwwfHx8fDE3NDM4OTI0Nzl8MA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=200" 
                alt="Delivery notification sign" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Job Approval System</h3>
            <p className="text-sm text-blue-700 mt-1">
              {isAdmin ? (
                "This dashboard allows administrators to review, accept, decline, or outsource delivery jobs. Select a booking to see more details and take action."
              ) : (
                "As a worker with job management permissions, you can review and take action on delivery bookings. Select a booking to see more details."
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {getStatusBadge('pending')} {getStatusBadge('confirmed')} {getStatusBadge('outsourced')} {getStatusBadge('declined')}
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <p className="ml-3 text-gray-600">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No bookings match your criteria</p>
          <p className="text-sm text-gray-500 mt-1">Try changing your search terms or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Clear Filters
          </button>
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
                  Date/Time {renderSortIndicator('timestamp')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('vehicleType')}
                >
                  Service {renderSortIndicator('vehicleType')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('collectionName')}
                >
                  From {renderSortIndicator('collectionName')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('deliveryName')}
                >
                  To {renderSortIndicator('deliveryName')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  Collection Date {renderSortIndicator('date')}
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking, index) => (
                <tr 
                  key={booking.bookingId}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedBooking === booking.bookingId ? 'bg-blue-50' : ''} hover:bg-blue-50 cursor-pointer transition-colors`}
                  onClick={() => setSelectedBooking(booking.bookingId === selectedBooking ? null : booking.bookingId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {booking.vehicleType === 'bike' ? (
                        <Bike className="w-4 h-4 text-blue-600 mr-1" />
                      ) : (
                        <Truck className="w-4 h-4 text-blue-600 mr-1" />
                      )}
                      {booking.vehicleType === 'bike' ? 'Bike' : 'Van'}
                      {booking.isUrgent === 'Yes' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Urgent
                        </span>
                      )}
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
                    <div>{booking.date}</div>
                    <div className="text-xs text-blue-600">{booking.deliveryTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                    {booking.outsourcedTo && (
                      <div className="text-xs text-purple-600 mt-1">
                        To: {booking.outsourcedTo}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    £{booking.totalPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Booking Details and Action Panel */}
      {selectedBooking && bookingSelected && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Booking Details
              <span className="text-xs font-normal text-gray-500">
                ID: {bookingSelected.bookingId.substring(0, 8)}
              </span>
            </h3>
            <button
              onClick={() => setSelectedBooking(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Collection Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Name:</span> {bookingSelected.collectionName}
                    </p>
                    <p>
                      <span className="text-gray-500">Address:</span> {bookingSelected.collectionAddress}
                    </p>
                    <p>
                      <span className="text-gray-500">Postcode:</span> {bookingSelected.collectionPostcode}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Delivery Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Name:</span> {bookingSelected.deliveryName}
                    </p>
                    <p>
                      <span className="text-gray-500">Address:</span> {bookingSelected.deliveryAddress}
                    </p>
                    <p>
                      <span className="text-gray-500">Postcode:</span> {bookingSelected.deliveryPostcode}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Schedule & Pricing
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Collection Date:</span> {bookingSelected.date}
                    </p>
                    <p>
                      <span className="text-gray-500">Collection Time:</span> {bookingSelected.deliveryTime}
                    </p>
                    <p>
                      <span className="text-gray-500">Urgent Delivery:</span> {bookingSelected.isUrgent}
                    </p>
                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <p>
                        <span className="text-gray-500">Base Price:</span> £{bookingSelected.basePrice}
                      </p>
                      <p>
                        <span className="text-gray-500">VAT:</span> £{bookingSelected.vat}
                      </p>
                      <p className="font-medium">
                        <span className="text-gray-500">Total:</span> £{bookingSelected.totalPrice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">User ID:</span> {bookingSelected.userId}
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Email:</span> {bookingSelected.contactEmail || 'Not provided'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Phone:</span> {bookingSelected.contactPhone || 'Not provided'}
                  </p>
                </div>
              </div>
              
              {bookingSelected.additionalInfo && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-green-600" />
                    Special Instructions
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {bookingSelected.additionalInfo}
                  </p>
                </div>
              )}
              
              {/* Status-specific information */}
              {bookingSelected.status === 'outsourced' && (
                <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                    Outsourced Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Partner:</span> {bookingSelected.outsourcedTo}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span> {bookingSelected.outsourcedEmail || 'Not provided'}
                    </p>
                    <p>
                      <span className="text-gray-500">Phone:</span> {bookingSelected.outsourcedPhone || 'Not provided'}
                    </p>
                    {bookingSelected.outsourcedNotes && (
                      <p>
                        <span className="text-gray-500">Notes:</span> {bookingSelected.outsourcedNotes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Outsourced on {new Date(bookingSelected.outsourcedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {bookingSelected.status === 'declined' && bookingSelected.declineReason && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Decline Reason
                  </h4>
                  <p className="text-sm text-gray-700">
                    {bookingSelected.declineReason}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Declined on {new Date(bookingSelected.declinedAt).toLocaleString()}
                  </p>
                </div>
              )}
              
              {/* Action buttons for pending bookings */}
              {bookingSelected.status === 'pending' && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    Job Actions
                  </h4>
                  <div className="space-y-2">
                    <img 
                      src="https://images.unsplash.com/photo-1504376830547-506dedfe1fe9?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGNvdXJpZXIlMjBzZXJ2aWNlJTIwbG9naXN0aWNzJTIwYXBwcm92YWwlMjBhZG1pbiUyMGRhc2hib2FyZHxlbnwwfHx8fDE3NDM4OTI0Nzl8MA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=800" 
                      alt="Colorful logistics containers" 
                      className="w-full h-24 object-cover rounded-md mb-3"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleJobAction(bookingSelected.bookingId, 'confirmed')}
                        disabled={isUpdating}
                        className="flex flex-col items-center p-3 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <Check className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Accept</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setOutsourceData({
                            bookingId: bookingSelected.bookingId,
                            partnerName: '',
                            partnerEmail: '',
                            partnerPhone: '',
                            notes: ''
                          });
                          setShowOutsourceForm(true);
                        }}
                        disabled={isUpdating}
                        className="flex flex-col items-center p-3 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Outsource</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setOutsourceData({
                            bookingId: bookingSelected.bookingId,
                            partnerName: '',
                            partnerEmail: '',
                            partnerPhone: '',
                            notes: ''
                          });
                          setShowOutsourceForm(true);
                        }}
                        disabled={isUpdating}
                        className="flex flex-col items-center p-3 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <X className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Outsource Form Modal */}
      {showOutsourceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {bookingSelected?.status === 'pending' ? 'Outsource Job' : 'Decline Job'}
              </h3>
              <button 
                onClick={() => setShowOutsourceForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {bookingSelected?.status === 'pending' ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Enter the details of the external partner who will handle this delivery job:
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner Company Name *
                    </label>
                    <input
                      id="partnerName"
                      type="text"
                      value={outsourceData.partnerName}
                      onChange={(e) => setOutsourceData({...outsourceData, partnerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="partnerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner Email
                    </label>
                    <input
                      id="partnerEmail"
                      type="email"
                      value={outsourceData.partnerEmail}
                      onChange={(e) => setOutsourceData({...outsourceData, partnerEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="partnerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner Phone
                    </label>
                    <input
                      id="partnerPhone"
                      type="tel"
                      value={outsourceData.partnerPhone}
                      onChange={(e) => setOutsourceData({...outsourceData, partnerPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Outsourcing Notes
                    </label>
                    <textarea
                      id="notes"
                      value={outsourceData.notes}
                      onChange={(e) => setOutsourceData({...outsourceData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Add any notes about this outsourcing arrangement"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowOutsourceForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!outsourceData.partnerName) {
                        alert('Partner name is required');
                        return;
                      }
                      handleJobAction(outsourceData.bookingId, 'outsourced', outsourceData);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Outsource Job
                      </div>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Please provide a reason for declining this job:
                  </p>
                </div>
                
                <div>
                  <textarea
                    id="declineReason"
                    value={outsourceData.notes}
                    onChange={(e) => setOutsourceData({...outsourceData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="Enter the reason for declining this job"
                    required
                  />
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowOutsourceForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!outsourceData.notes) {
                        alert('Please provide a reason for declining');
                        return;
                      }
                      handleJobAction(outsourceData.bookingId, 'declined', outsourceData);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Decline Job
                      </div>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 