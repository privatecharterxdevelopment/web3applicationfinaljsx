import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ReviewDisputeModal = ({ booking, onClose, mode = 'dispute' }) => {
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const disputeReasons = [
    'Driver was late',
    'Incorrect route taken',
    'Poor vehicle condition',
    'Unprofessional behavior',
    'Overcharged',
    'Safety concerns',
    'Other'
  ];

  const handleSubmitDispute = async () => {
    if (!disputeReason || !disputeDescription) {
      alert('Please select a reason and provide details');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create dispute record
      const { data: dispute, error: disputeError } = await supabase
        .from('ride_disputes')
        .insert({
          booking_id: booking.id,
          user_id: user.id,
          reason: disputeReason,
          description: disputeDescription,
          status: 'open',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Create support ticket
      await supabase.from('support_tickets').insert({
        user_id: user.id,
        type: 'ride_dispute',
        priority: 'high',
        subject: `Ride Dispute - Booking #${booking.id.substring(0, 8)}`,
        description: `${disputeReason}\n\n${disputeDescription}`,
        status: 'open',
        related_booking_id: booking.id,
        created_at: new Date().toISOString()
      });

      // Update booking
      await supabase
        .from('user_requests')
        .update({ disputed: true })
        .eq('id', booking.id);

      // Notify admin
      await supabase.from('notifications').insert({
        user_id: 'admin', // Replace with actual admin user ID
        type: 'dispute_created',
        title: 'New Ride Dispute',
        message: `User has filed a dispute for booking #${booking.id.substring(0, 8)}`,
        metadata: { bookingId: booking.id, disputeId: dispute.id },
        is_read: false,
        created_at: new Date().toISOString()
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dispute Filed Successfully
          </h3>
          <p className="text-gray-600">
            Our admin team will review your dispute and contact you within 24 hours via email or support ticket.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            File a Dispute
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Booking Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-900">
            {booking.type === 'taxi_concierge'
              ? `${booking.data?.carType?.name || 'Taxi'} Ride`
              : 'Empty Leg Flight'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {booking.type === 'taxi_concierge'
              ? `${booking.data?.from} → ${booking.data?.to}`
              : `${booking.data?.from} → ${booking.data?.to}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(booking.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Dispute Warning */}
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-800">
            Filing a dispute will create a high-priority support ticket. Our admin team will investigate and contact you within 24 hours.
          </p>
        </div>

        {/* Dispute Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Reason for Dispute *
          </label>
          <select
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Select a reason</option>
            {disputeReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {/* Dispute Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Please provide details *
          </label>
          <textarea
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            placeholder="Explain what went wrong and how you'd like us to resolve it..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            rows={5}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitDispute}
          disabled={isSubmitting || !disputeReason || !disputeDescription}
          className="w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
        >
          {isSubmitting ? 'Filing Dispute...' : 'File Dispute'}
        </button>
      </div>
    </div>
  );
};

export default ReviewDisputeModal;
