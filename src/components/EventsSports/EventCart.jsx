import React from 'react';
import { X, Calendar, MapPin, Trash2, ShoppingCart, ExternalLink } from 'lucide-react';
import { ticketmasterService } from '../../services/ticketmasterService';
import { eventbriteService } from '../../services/eventbriteService';

const EventCart = ({ cart = [], setCart }) => {
  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.cartId !== itemId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Get event image based on source
  const getEventImage = (event) => {
    if (event.source === 'eventbrite') {
      return event.logo || event.image || 'https://via.placeholder.com/400x225?text=Event';
    }
    return ticketmasterService.getEventImage(event.images, '16_9') || 'https://via.placeholder.com/400x225?text=Event';
  };

  // Format date based on source
  const formatDate = (event) => {
    if (event.source === 'eventbrite') {
      return eventbriteService.formatEventDate(event);
    }
    return ticketmasterService.formatEventDate(event.dates);
  };

  // Format venue based on source
  const getVenueInfo = (event) => {
    if (event.source === 'eventbrite') {
      return eventbriteService.getVenueInfo(event);
    }
    return event.venues?.[0]?.name || 'Venue TBA';
  };

  // Format price based on source
  const formatPrice = (event) => {
    if (event.source === 'eventbrite') {
      return eventbriteService.formatPrice(event);
    }
    return ticketmasterService.formatPriceRange(event.priceRanges);
  };

  // Calculate total (only for Eventbrite events with actual prices)
  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      if (item.source === 'eventbrite' && item.ticket_availability?.minimum_ticket_price) {
        const price = parseFloat(item.ticket_availability.minimum_ticket_price.major_value);
        const quantity = item.quantity || 1;
        total += price * quantity;
      }
    });
    return total;
  };

  // Handle checkout for Eventbrite
  const handleCheckout = (item) => {
    if (item.source === 'eventbrite' && item.hasCheckout) {
      // Create checkout URL with pre-filled tickets
      const tickets = item.ticketClasses
        ? { [item.ticketClasses[0]?.id]: item.quantity || 1 }
        : {};
      const checkoutUrl = eventbriteService.createCheckoutUrl(item.id, tickets);
      window.open(checkoutUrl, '_blank');
    } else {
      // For Ticketmaster, just open the event page
      window.open(item.url, '_blank');
    }
  };

  const total = calculateTotal();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Event Cart</h1>
          <p className="text-sm text-gray-600">
            {cart.length} {cart.length === 1 ? 'event' : 'events'} in your cart
          </p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Content */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          // Empty state
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingCart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Browse events and add tickets to your cart to continue with checkout
            </p>
          </div>
        ) : (
          // Cart items
          <div className="space-y-4 pb-32">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {/* Event Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={getEventImage(item)}
                      alt={item.name}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-[15px] text-gray-900 line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Remove from cart"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span className="truncate">{formatDate(item)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{getVenueInfo(item)}</span>
                      </div>
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[14px] text-gray-900">
                          {formatPrice(item)}
                        </div>
                        {item.quantity && item.quantity > 1 && (
                          <div className="text-[12px] text-gray-500">
                            Quantity: {item.quantity}
                          </div>
                        )}
                      </div>

                      {/* Checkout Button */}
                      <button
                        onClick={() => handleCheckout(item)}
                        className="px-4 py-2 bg-black text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        {item.hasCheckout ? 'Checkout' : 'View Details'}
                        <ExternalLink size={14} />
                      </button>
                    </div>

                    {/* Source Badge */}
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                        item.source === 'eventbrite'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'}
                      </span>
                      {item.hasCheckout && (
                        <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                          Direct Checkout
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Summary - Fixed at bottom */}
      {cart.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Summary Info */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Events:</span>
                <span className="font-medium text-gray-900">{cart.length}</span>
              </div>

              {total > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    * Final prices may vary. Complete checkout on event provider's site.
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  // Checkout all Eventbrite events
                  const eventbriteItems = cart.filter(item => item.hasCheckout && item.source === 'eventbrite');
                  if (eventbriteItems.length > 0) {
                    eventbriteItems.forEach(item => handleCheckout(item));
                  } else {
                    alert('Please checkout individual events. Some events require visiting the provider website.');
                  }
                }}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCart;
