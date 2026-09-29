/**
 * Core type definitions for the Morfikos Flight Booking application.
 */

export type FlowStep =
  | 'search'
  | 'results'
  | 'flight_detail'
  | 'seat_selection'
  | 'passenger_details'
  | 'payment'
  | 'confirmation'
  | 'my_trips';

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type TripType = 'oneWay' | 'roundTrip';

export interface Airport {
  code: string;           // e.g. "JFK", "LHR"
  name: string;           // e.g. "John F. Kennedy International Airport"
  city: string;           // e.g. "New York"
  country: string;        // e.g. "United States"
  flag: string;           // emoji or region code
  timezone: string;
  popular?: boolean;
}

export interface FlightLeg {
  id: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  aircraft: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;   // ISO string e.g. "2026-09-28T08:30:00"
  arrivalTime: string;     // ISO string e.g. "2026-09-28T14:15:00"
  durationMinutes: number;
  terminalDep?: string;
  terminalArr?: string;
}

export interface Layover {
  airport: Airport;
  durationMinutes: number;
  isOvernight?: boolean;
}

export interface BaggageAllowance {
  personalItem: boolean;     // Included in all
  carryOn: boolean;          // E.g. Included in standard & above
  checkedBagCount: number;   // E.g. 0 for basic, 1 for standard, 2 for business
  checkedBagKg: number;      // E.g. 23
  extraBagFee: number;       // Fee for additional bag
}

export interface FareConditions {
  refundable: boolean;
  changeAllowed: boolean;
  changeFee: number;
  cancellationNotice: string;
}

export interface Flight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogoColor: string; // Brand accent color
  flightNumber: string;
  aircraft: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;    // ISO string
  arrivalTime: string;      // ISO string
  durationMinutes: number;
  stops: number;            // 0 = Direct, 1 = 1 Stop, 2 = 2 Stops
  layovers: Layover[];
  legs: FlightLeg[];
  basePrice: number;        // Base price in USD per adult
  taxes: number;            // Taxes and mandatory airport fees
  cabinClass: CabinClass;
  baggage: BaggageAllowance;
  amenities: string[];      // e.g. "WiFi", "In-seat power", "Hot meal", "Streaming"
  fareConditions: FareConditions;
  seatsAvailable: number;
  carbonEmissionsKg: number;
  isPopularChoice?: boolean;
}

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface SearchParams {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  departureDate: string;    // YYYY-MM-DD
  returnDate?: string;      // YYYY-MM-DD
  passengers: PassengerCount;
  cabinClass: CabinClass;
}

export type SortOption = 'price_asc' | 'duration_asc' | 'departure_asc' | 'best';

export interface FilterOptions {
  stops: ('all' | '0' | '1' | '2')[];
  airlines: string[];
  departureTimeRange: ('all' | 'morning' | 'afternoon' | 'evening')[];
  maxPrice: number;
}

export type PassengerType = 'adult' | 'child' | 'infant';

export interface PassengerInfo {
  id: string;
  type: PassengerType;
  title: string;          // Mr, Ms, Mrs, Dr
  firstName: string;
  lastName: string;
  dateOfBirth: string;    // YYYY-MM-DD
  gender: string;         // male, female, other
  email?: string;         // Required for primary adult
  phone?: string;         // Required for primary adult
  passportNumber?: string;
  seatAssigned?: string;  // e.g. "14B"
}

export interface PassengerValidationErrors {
  title?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
}

export type SeatClass = 'business' | 'economy';
export type SeatStatus = 'available' | 'occupied' | 'selected';
export type SeatLocation = 'window' | 'middle' | 'aisle';

export interface Seat {
  id: string;             // e.g. "12A"
  row: number;
  col: string;
  class: SeatClass;
  location: SeatLocation;
  status: SeatStatus;
  price: number;          // 0 for standard, e.g. $25 for extra legroom, $50 for business
  isExitRow?: boolean;
  extraLegroom?: boolean;
}

export interface PriceBreakdown {
  baseFare: number;
  taxesAndFees: number;
  passengerCount: number;
  seatFees: number;
  baggageFees: number;
  total: number;
}

export interface PaymentDetails {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'generic';
}

export interface Booking {
  id: string;
  referenceCode: string;   // e.g. "MF-4928X"
  createdAt: string;
  expiresAt?: number;      // Epoch timestamp (ms) when booking view/reservation expires
  outboundFlight: Flight;
  returnFlight?: Flight;
  passengers: PassengerInfo[];
  seats: Record<string, string>; // passengerId -> seatId
  priceBreakdown: PriceBreakdown;
  status: 'confirmed' | 'cancelled';
  paymentSummary: {
    brand: string;
    last4: string;
  };
}

export type ScreenStep =
  | 'search'
  | 'results'
  | 'flight_detail'
  | 'seat_selection'
  | 'passenger_details'
  | 'payment'
  | 'confirmation'
  | 'my_trips';
