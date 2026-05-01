import React, { useState, useEffect } from 'react';
import { createFirestoreBooking, getArtistBookings } from '@/lib/firebaseBookingAPI';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  artistId: string;
  artistName: string;
  hourlyRate?: number;
  onClose: () => void;
  clientId?: string;
  prefilledSlot?: { date: string; start: string; end: string };
  availableSlots?: { date: string; startTime: string; endTime: string; status?: string }[];
}

export function FirebaseBookingForm({ artistId, artistName, hourlyRate = 250, onClose, clientId, prefilledSlot, availableSlots = [] }: BookingFormProps) {
  const router = useRouter();
  const isIntl = artistId?.startsWith('intl-');
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getSlotDateString = (dateValue: string) => formatLocalDate(new Date(dateValue));
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    eventDate: prefilledSlot ? prefilledSlot.date : '',
    startTime: prefilledSlot ? prefilledSlot.start : '',
    endTime: prefilledSlot ? prefilledSlot.end : '',
    eventType: 'party',
    eventTitle: '',
    location: '',
    specialRequest: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    if (!prefilledSlot) return;
    setFormData((prev) => ({
      ...prev,
      eventDate: prefilledSlot.date,
      startTime: prefilledSlot.start,
      endTime: prefilledSlot.end,
    }));
    setError('');
  }, [prefilledSlot]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingDates(true);
      try {
        const bookings = await getArtistBookings(artistId);
        // Only consider pending/confirmed bookings as blocking time slots
        const activeBookings = bookings.filter((b: any) => 
          b.status !== 'cancelled' && b.paymentStatus !== 'refunded'
        );
        setExistingBookings(activeBookings);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoadingDates(false);
      }
    };
    if (artistId) fetchBookings();
  }, [artistId]);

  const TIME_SLOTS = [
    { label: "4:00 PM - 6:00 PM", start: "16:00", end: "18:00" },
    { label: "6:30 PM - 8:30 PM", start: "18:30", end: "20:30" },
    { label: "9:00 PM - 11:00 PM", start: "21:00", end: "23:00" },
    { label: "11:30 PM - 1:00 AM", start: "23:30", end: "01:00" }
  ];

  const handleSlotSelect = (start: string, end: string) => {
    setFormData(prev => ({ ...prev, startTime: start, endTime: end }));
  };

  const isSlotBooked = (start: string, end: string) => {
    if (!formData.eventDate) return false;
    
    // Find any booking on the same date that overlaps this 2-hour slot
    return existingBookings.some((booking) => {
      if (booking.eventDate !== formData.eventDate) return false;
      const bStart = booking.startTime;
      const bEnd = booking.endTime === '00:00' ? '24:00' : booking.endTime;
      
      let bEndVal = parseFloat(bEnd.replace(':', '.'));
      if (bEndVal < parseFloat(bStart.replace(':', '.'))) bEndVal += 24;

      const slotStart = parseFloat(start.replace(':', '.'));
      let slotEndVal = parseFloat(end.replace(':', '.'));
      if (slotEndVal < slotStart) slotEndVal += 24;

      const compStart = parseFloat(bStart.replace(':', '.'));
      
      // Overlap condition:
      // A booking overlaps a slot if its start is before the slot ends
      // AND its end is after the slot starts
      return (compStart < slotEndVal && bEndVal > slotStart);
    });
  };

  const isSlotPublished = (start: string, end: string) => {
    if (!formData.eventDate) return false;
    if (isIntl) return true;

    // If availability exists, only those slots are bookable.
    if (availableSlots.length > 0) {
      return availableSlots.some((slot) => {
        const slotDate = getSlotDateString(slot.date);
        return (
          slotDate === formData.eventDate &&
          slot.startTime === start &&
          slot.endTime === end &&
          (slot.status === undefined || slot.status === 'Available')
        );
      });
    }

    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculateDurationHours = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let endHTemp = endH;
    if (endHTemp < startH || (endHTemp === startH && endM < startM)) {
      endHTemp += 24; // Accommodate spanning into the next day (e.g., 23:30 to 01:00)
    }
    let diff = (endHTemp + endM / 60) - (startH + startM / 60);
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIntl) {
      if (!formData.startTime || !formData.endTime) {
        setError('Please select an available time slot.');
        return;
      }

      if (!isSlotPublished(formData.startTime, formData.endTime)) {
        setError('This slot is not published by the artist. Please select a published slot.');
        return;
      }

      const startVal = parseFloat(formData.startTime.replace(':', '.'));
      let endVal = parseFloat(formData.endTime.replace(':', '.'));
      if (endVal < startVal) endVal += 24;

      if (startVal >= endVal) {
        setError('End time must be after the start time.');
        return;
      }
    }

    setLoading(true);
    setError('');

    const calcHours = (isIntl || (!formData.startTime || !formData.endTime)) ? 0 : calculateDurationHours(formData.startTime, formData.endTime);
    const finalTotalPrice = isIntl ? hourlyRate : Math.max(calcHours * hourlyRate, hourlyRate);
    const advanceAmount = finalTotalPrice * 0.5;

    try {
      console.log('Initiating checkout for artist:', artistId, 'amount:', advanceAmount);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            ...formData,
            artistId,
            artistName,
            totalPrice: finalTotalPrice,
            advanceAmount,
            clientId: clientId || 'guest'
          },
          amount: advanceAmount,
          successUrl: `${window.location.origin}/booking-success`,
          cancelUrl: window.location.href, // Stay on the same page
        }),
      });

      // Verify the response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("API returned non-JSON response:", await response.text());
        throw new Error("API route not found or returned an invalid response format.");
      }

      const data = await response.json();
      console.log('Received response from checkout session API:', data);

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('API returned success but no redirect URL was found in the response.');
      }

      toast.success('Redirecting to secure checkout...');
      window.location.href = data.url;
      
    } catch (err: any) {
      console.error('Frontend Checkout Error:', err);
      setError(err.message || 'Payment initialization failed. Please try again.');
      toast.error(err.message || 'Payment initialization failed.');
      setLoading(false);
    }
  };

  // Calculate live values for summary
  const hours = (!isIntl && formData.startTime && formData.endTime) ? calculateDurationHours(formData.startTime, formData.endTime) : 0;
  const totalPrice = isIntl ? hourlyRate : Math.max(hours * hourlyRate, (formData.startTime && formData.endTime) ? hourlyRate : 0);
  const advanceAmount = totalPrice * 0.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{isIntl ? 'Reserve' : 'Book'} {artistName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
              <input 
                required 
                type="text" 
                name="clientName" 
                value={formData.clientName} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
              <input 
                required 
                type="email" 
                name="clientEmail" 
                value={formData.clientEmail} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{isIntl ? 'Travel Arrival Date *' : 'Event Date *'}</label>
            <input 
              required 
              type="date" 
              name="eventDate" 
              value={formData.eventDate} 
              onChange={(e) => {
                handleChange(e);
                setFormData(prev => ({ ...prev, startTime: '', endTime: '' })); // clear slot when date changes
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors color-scheme-dark mb-4"
              min={formatLocalDate(new Date())} // prevent past bookings
            />

            {formData.eventDate && !isIntl && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium text-sm">Available Slots (2-Hour Blocks)</h3>
                  {loadingDates && (
                    <span className="text-xs text-yellow-500 animate-pulse">Syncing Calendar...</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = isSlotBooked(slot.start, slot.end);
                    const isPublished = isSlotPublished(slot.start, slot.end);
                    const isSelected = formData.startTime === slot.start && formData.endTime === slot.end;

                    return (
                      <button
                        type="button"
                        key={slot.label}
                        disabled={isBooked || !isPublished}
                        onClick={() => handleSlotSelect(slot.start, slot.end)}
                        className={`text-xs py-2 px-1 rounded-lg border transition-all duration-200 text-center font-medium ${
                          isBooked 
                            ? 'bg-gray-900 border-red-500/20 text-gray-500 cursor-not-allowed opacity-60' 
                            : !isPublished
                              ? 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg shadow-yellow-600/20'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        {slot.label}
                        {isBooked && <span className="block mt-0.5 text-[10px] text-red-400">Booked</span>}
                        {!isBooked && !isPublished && <span className="block mt-0.5 text-[10px] text-gray-500">Not published</span>}
                      </button>
                    );
                  })}
                </div>
                
                {formData.startTime && !loadingDates && (
                   <p className="mt-3 text-sm text-green-400 flex items-center gap-1.5">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Selected: {formData.startTime} - {formData.endTime}
                   </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Title *</label>
              <input 
                required 
                type="text" 
                name="eventTitle" 
                value={formData.eventTitle} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
                placeholder="e.g. Wedding Reception"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Type *</label>
              <select 
                name="eventType" 
                value={formData.eventType} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="wedding">Wedding</option>
                <option value="party">Private Party</option>
                <option value="corporate">Corporate Event</option>
                <option value="concert">Concert/Festival</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{isIntl ? 'Sri Lanka Event Location *' : 'Event Location *'}</label>
            <input 
              required 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
              placeholder="Venue name, Address, City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{isIntl ? 'Travel & Special Requirements (Optional)' : 'Special Requests (Optional)'}</label>
            <textarea 
              name="specialRequest" 
              value={formData.specialRequest} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors min-h-[80px]"
              placeholder={isIntl ? "Specify flight tiers, VIP security needs, hotel requirements, etc." : "Any specific songs, themes, or gear requirements?"}
            />
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mt-2 mb-4">
            <h3 className="text-white font-medium text-sm mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-gray-400">
                <span>{isIntl ? 'International Guarantee' : 'Duration'}</span>
                <span className="text-white">{isIntl ? 'Fixed Booking Rate' : `${hours} Hour(s)`}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>{isIntl ? 'Starting Rate' : 'Hourly Rate'}</span>
                <span className="text-white">{isIntl ? `$${hourlyRate.toFixed(2)} based` : `$${hourlyRate.toFixed(2)}/hr`}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 pb-2 border-b border-gray-800">
                <span>{isIntl ? 'Estimated Booking Fee' : 'Total Fee'}</span>
                <span className="text-white font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-300 font-medium">Advance Payment Required (50%)</span>
                <span className="text-yellow-400 font-bold text-lg">${advanceAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">Remaining balance due on event day</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium border border-gray-600"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || totalPrice === 0}
              className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 disabled:opacity-50 text-white rounded-lg transition-colors font-bold shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_20px_rgba(217,119,6,0.5)] flex items-center justify-center min-w-[200px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                `Pay Advance & Reserve`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
