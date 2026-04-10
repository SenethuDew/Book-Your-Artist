import React, { useState } from 'react';
import { createFirestoreBooking } from '@/lib/firebaseBookingAPI';
import toast from 'react-hot-toast';

interface BookingFormProps {
  artistId: string;
  artistName: string;
  onClose: () => void;
  clientId?: string;
}

export function FirebaseBookingForm({ artistId, artistName, onClose, clientId }: BookingFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    eventDate: '',
    eventTime: '',
    eventType: 'party',
    location: '',
    specialRequest: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await createFirestoreBooking({
      ...formData,
      artistId,
      artistName,
      status: 'pending',
      clientId: clientId || 'guest'
    });

    setLoading(false);
    if (res.success) {
      toast.success('🎉 Booking successfully created!');
      onClose(); // Close modal upon success
    } else {
      setError(res.error || 'Failed to create booking.');
      toast.error(res.error || 'Booking failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Book {artistName}</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Date *</label>
              <input 
                required 
                type="date" 
                name="eventDate" 
                value={formData.eventDate} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors color-scheme-dark"
                min={new Date().toISOString().split('T')[0]} // prevent past bookings
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Time *</label>
              <input 
                required 
                type="time" 
                name="eventTime" 
                value={formData.eventTime} 
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors color-scheme-dark"
              />
            </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Event Location *</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Special Requests (Optional)</label>
            <textarea 
              name="specialRequest" 
              value={formData.specialRequest} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 transition-colors min-h-[80px]"
              placeholder="Any specific songs, themes, or gear requirements?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 disabled:opacity-50 text-white rounded-lg transition-colors font-bold shadow-lg shadow-yellow-600/30 flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
