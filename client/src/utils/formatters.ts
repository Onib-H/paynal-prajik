import { BookingResponse } from "../services/Booking";

/**
 * Format a number as a currency string (₱)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse a price value from a formatted string (removes ₱ and commas)
 * @param price The price string or number to parse
 * @returns A numeric value
 */
export const parsePriceValue = (price: string | number): number => {
  if (typeof price === "number") return price;

  const numericString = price.replace(/[^\d.]/g, "");
  return parseFloat(numericString) || 0;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format a date with time
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
  * Format a time string to a readable format
  */

export const getBookingPrice = (booking: BookingResponse): number => {
    try {
        if (booking.total_price) {
            const totalPrice = typeof booking.total_price === 'string'
                ? parseFloat(booking.total_price.replace(/[^\d.]/g, ''))
                : booking.total_price;
            return totalPrice || 0;
        }

        let basePrice = 0;

        if (booking.is_venue_booking && booking.area_details) {
            if (booking.area_details.price_per_hour) {
                const priceString = booking.area_details.price_per_hour;
                basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
            }
            return basePrice;
        } else if (!booking.is_venue_booking && booking.room_details) {
            const checkIn = booking.check_in_date;
            const checkOut = booking.check_out_date;
            let nights = 1;
            if (checkIn && checkOut) {
                const start = new Date(checkIn);
                const end = new Date(checkOut);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                nights = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
            }

            if (booking.room_details.room_price) {
                const priceString = booking.room_details.room_price;
                basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
            }

            return basePrice * nights;
        }

        return basePrice;
    } catch (error) {
        console.error(`Error parsing booking price: ${error}`);
        return 0;
    }
};
