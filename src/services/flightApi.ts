import { Flight, SearchParams, Booking, Seat } from '../types/flight';
import { generateMockFlights } from '../data/mockFlights';

export interface SearchFlightsResult {
  flights: Flight[];
  totalCount: number;
}

export interface ApiOptions {
  forceError?: boolean;
  delayMs?: number;
}

export async function searchFlightsApi(
  params: SearchParams,
  options?: ApiOptions
): Promise<Flight[]> {
  const delay = options?.delayMs ?? 1200;

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (options?.forceError) {
    throw new Error('Network connection lost. Please check your internet connection and try again.');
  }

  if (!params.origin || !params.destination) {
    throw new Error('Origin and destination airports are required.');
  }

  if (params.origin.code === params.destination.code) {
    throw new Error('Origin and destination cannot be the same airport.');
  }

  // Generate deterministic flights
  const flights = generateMockFlights(
    params.origin,
    params.destination,
    params.departureDate,
    params.cabinClass
  );

  return flights;
}

/**
 * Generates seat map for a given flight and cabin class.
 */
export function generateSeatMap(flight: Flight): Seat[] {
  const seats: Seat[] = [];
  const rows = flight.cabinClass === 'business' ? 6 : 14;
  const startRow = flight.cabinClass === 'business' ? 1 : 10;
  const cols = flight.cabinClass === 'business' ? ['A', 'C', 'D', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F'];

  for (let r = startRow; r < startRow + rows; r++) {
    const isExitRow = r === 14;
    const isExtraLegroom = r <= 12 || isExitRow;

    cols.forEach((col) => {
      let location: 'window' | 'middle' | 'aisle' = 'middle';
      if (col === 'A' || col === 'F') location = 'window';
      else if (col === 'C' || col === 'D') location = 'aisle';

      // Deterministic occupied seats based on row & col
      const hash = (r * 7 + col.charCodeAt(0)) % 11;
      const isOccupied = hash === 1 || hash === 4 || hash === 8;

      let price = 0;
      if (flight.cabinClass === 'business') {
        price = 0; // Included in business
      } else if (isExitRow) {
        price = 35;
      } else if (isExtraLegroom) {
        price = 22;
      } else if (location === 'window' || location === 'aisle') {
        price = 10;
      }

      seats.push({
        id: `${r}${col}`,
        row: r,
        col,
        class: flight.cabinClass === 'business' ? 'business' : 'economy',
        location,
        status: isOccupied ? 'occupied' : 'available',
        price,
        isExitRow,
        extraLegroom: isExtraLegroom,
      });
    });
  }

  return seats;
}

/**
 * Simulates a payment processing charge.
 */
export async function processPaymentApi(
  amount: number,
  cardBrand: string,
  cardNumber: string
): Promise<{ success: boolean; transactionId: string; error?: string }> {
  // 1.1s realistic processing delay
  await new Promise((resolve) => setTimeout(resolve, 1100));

  // If card ends with 0000, simulate payment decline
  const cleanNum = cardNumber.replace(/\s+/g, '');
  if (cleanNum.endsWith('0000')) {
    return {
      success: false,
      transactionId: '',
      error: 'Card declined: Insufficient funds or card issuer rejected transaction (Test Code 0000).',
    };
  }

  const transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    success: true,
    transactionId,
  };
}
