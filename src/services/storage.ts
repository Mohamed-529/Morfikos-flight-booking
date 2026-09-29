import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, SearchParams } from '../types/flight';
import { AIRPORTS } from '../data/airports';
import { getFutureDateString } from '../utils/formatters';

const BOOKINGS_STORAGE_KEY = 'morfikos_flight_bookings_v3';
const RECENT_SEARCHES_KEY = 'morfikos_recent_searches_v3';

// 10 years in the future so user bookings never prematurely expire
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

function normalizeBooking(b: any): Booking {
  if (!b) return b;
  const ref = b.referenceCode || b.bookingReference || `MF-${Math.floor(1000 + Math.random() * 9000)}A`;
  const total = Number(b.priceBreakdown?.total ?? b.totalAmount ?? (b.outboundFlight?.basePrice ? b.outboundFlight.basePrice + (b.outboundFlight.taxes || 0) : 450));
  const baseFare = Number(b.priceBreakdown?.baseFare ?? b.outboundFlight?.basePrice ?? Math.round(total * 0.8));
  const taxesAndFees = Number(b.priceBreakdown?.taxesAndFees ?? b.outboundFlight?.taxes ?? (total - baseFare));

  const priceBreakdown = {
    baseFare,
    taxesAndFees,
    passengerCount: b.priceBreakdown?.passengerCount || (Array.isArray(b.passengers) ? b.passengers.length : 1),
    seatFees: b.priceBreakdown?.seatFees || 0,
    baggageFees: b.priceBreakdown?.baggageFees || 0,
    total,
  };

  const paymentSummary = b.paymentSummary || {
    brand: b.paymentInfo?.cardBrand || 'Visa',
    last4: b.paymentInfo?.cardLast4 || '4242',
  };

  const seats: Record<string, string> = b.seats || {};
  if (Array.isArray(b.passengers)) {
    b.passengers.forEach((p: any) => {
      if (p && p.id && p.seatNumber && !seats[p.id]) {
        seats[p.id] = p.seatNumber;
      }
    });
  }

  return {
    ...b,
    referenceCode: ref,
    priceBreakdown,
    paymentSummary,
    seats,
    status: b.status === 'cancelled' ? 'cancelled' : 'confirmed',
  };
}

// Seed 3 realistic, high-quality initial bookings so a fresh device/mobile scan is never empty
function getInitialSeedBookings(): Booking[] {
  const dxb = AIRPORTS.find((a) => a.code === 'DXB') || AIRPORTS[5];
  const sin = AIRPORTS.find((a) => a.code === 'SIN') || AIRPORTS[6];
  const lhr = AIRPORTS.find((a) => a.code === 'LHR') || AIRPORTS[1];
  const jfk = AIRPORTS.find((a) => a.code === 'JFK') || AIRPORTS[0];
  const cdg = AIRPORTS.find((a) => a.code === 'CDG') || AIRPORTS[3];
  const hnd = AIRPORTS.find((a) => a.code === 'HND') || AIRPORTS[4];

  return [
    normalizeBooking({
      id: 'bk-seed-1',
      referenceCode: 'MF-8924A',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + TEN_YEARS_MS,
      status: 'confirmed',
      priceBreakdown: {
        baseFare: 1250,
        taxesAndFees: 200,
        passengerCount: 1,
        seatFees: 0,
        baggageFees: 0,
        total: 1450,
      },
      outboundFlight: {
        id: 'fl-seed-1',
        flightNumber: 'EK 354',
        airlineCode: 'EK',
        airlineName: 'Emirates',
        airlineLogoColor: '#d71921',
        departureAirport: dxb,
        arrivalAirport: sin,
        departureTime: `${getFutureDateString(4)}T08:15:00`,
        arrivalTime: `${getFutureDateString(4)}T19:45:00`,
        durationMinutes: 450,
        stops: 0,
        cabinClass: 'business',
        basePrice: 1250,
        taxes: 200,
        availableSeats: 6,
        aircraft: 'Airbus A380-800',
        baggageAllowance: '2 x 32kg included',
      },
      passengers: [
        {
          id: 'p-1',
          type: 'adult',
          title: 'Mr',
          firstName: 'Alexander',
          lastName: 'Morfikos',
          dateOfBirth: '1990-05-14',
          gender: 'male',
          seatNumber: '3A',
          email: 'alexander@morfikos.com',
          phone: '+971 50 123 4567',
        },
      ],
      paymentSummary: {
        brand: 'Visa',
        last4: '4242',
      },
      seats: { 'p-1': '3A' },
    }),
    normalizeBooking({
      id: 'bk-seed-2',
      referenceCode: 'MF-6130B',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + TEN_YEARS_MS,
      status: 'confirmed',
      priceBreakdown: {
        baseFare: 650,
        taxesAndFees: 130,
        passengerCount: 1,
        seatFees: 0,
        baggageFees: 0,
        total: 780,
      },
      outboundFlight: {
        id: 'fl-seed-2',
        flightNumber: 'BA 177',
        airlineCode: 'BA',
        airlineName: 'British Airways',
        airlineLogoColor: '#075aaa',
        departureAirport: lhr,
        arrivalAirport: jfk,
        departureTime: `${getFutureDateString(11)}T13:30:00`,
        arrivalTime: `${getFutureDateString(11)}T16:20:00`,
        durationMinutes: 470,
        stops: 0,
        cabinClass: 'economy',
        basePrice: 650,
        taxes: 130,
        availableSeats: 14,
        aircraft: 'Boeing 777-300ER',
        baggageAllowance: '1 x 23kg included',
      },
      passengers: [
        {
          id: 'p-2',
          type: 'adult',
          title: 'Ms',
          firstName: 'Elena',
          lastName: 'Vance',
          dateOfBirth: '1994-08-22',
          gender: 'female',
          seatNumber: '14C',
          email: 'elena@morfikos.com',
        },
      ],
      paymentSummary: {
        brand: 'Mastercard',
        last4: '8831',
      },
      seats: { 'p-2': '14C' },
    }),
    normalizeBooking({
      id: 'bk-seed-3',
      referenceCode: 'MF-4419C',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + TEN_YEARS_MS,
      status: 'cancelled',
      priceBreakdown: {
        baseFare: 790,
        taxesAndFees: 130,
        passengerCount: 1,
        seatFees: 0,
        baggageFees: 0,
        total: 920,
      },
      outboundFlight: {
        id: 'fl-seed-3',
        flightNumber: 'AF 274',
        airlineCode: 'AF',
        airlineName: 'Air France',
        airlineLogoColor: '#002157',
        departureAirport: cdg,
        arrivalAirport: hnd,
        departureTime: `${getFutureDateString(18)}T21:00:00`,
        arrivalTime: `${getFutureDateString(19)}T17:15:00`,
        durationMinutes: 735,
        stops: 0,
        cabinClass: 'economy',
        basePrice: 790,
        taxes: 130,
        availableSeats: 0,
        aircraft: 'Boeing 787-9',
        baggageAllowance: '1 x 23kg',
      },
      passengers: [
        {
          id: 'p-3',
          type: 'adult',
          title: 'Mr',
          firstName: 'Yusuf',
          lastName: 'Ahmed',
          dateOfBirth: '1992-11-03',
          gender: 'male',
          seatNumber: '22A',
        },
      ],
      paymentSummary: {
        brand: 'Visa',
        last4: '1099',
      },
      seats: { 'p-3': '22A' },
    }),
  ];
}

// Memory cache to ensure instant access across screens & reloads
let memoryBookings: Booking[] = getInitialSeedBookings();
let hasLoadedFromDisk = false;

export async function loadBookingsFromStorage(): Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with memory bookings
        const map = new Map<string, Booking>();
        parsed.map(normalizeBooking).forEach((b) => {
          if (b && b.id) map.set(b.id, b);
        });
        memoryBookings.forEach((b) => {
          if (b && b.id && !map.has(b.id)) map.set(b.id, b);
        });
        memoryBookings = Array.from(map.values());
        hasLoadedFromDisk = true;
        return memoryBookings;
      }
    }

    // Try legacy keys v2 and v1
    for (const legacyKey of ['morfikos_flight_bookings_v2', 'morfikos_flight_bookings_v1']) {
      const legacyRaw = await AsyncStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          memoryBookings = legacyParsed;
          await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(memoryBookings));
          hasLoadedFromDisk = true;
          return memoryBookings;
        }
      }
    }

    // First time install on phone: save default 3 seed bookings so it's ready immediately
    const seeds = getInitialSeedBookings();
    memoryBookings = seeds;
    await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(seeds));
    hasLoadedFromDisk = true;
    return seeds;
  } catch (err) {
    console.warn('Notice loading bookings from AsyncStorage, using cache', err);
    return memoryBookings;
  }
}

export async function saveBookingToStorage(booking: Booking): Promise<Booking[]> {
  try {
    const bookingPermanent: Booking = {
      ...booking,
      expiresAt: Date.now() + TEN_YEARS_MS,
    };

    const existing = hasLoadedFromDisk ? memoryBookings : await loadBookingsFromStorage();
    const safeExisting = Array.isArray(existing) ? existing : [];
    const updated = [bookingPermanent, ...safeExisting.filter((b) => b && b.id !== bookingPermanent.id)];
    
    memoryBookings = updated;
    await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Notice saving booking to AsyncStorage, cached in memory', err);
    const fallback = [
      {
        ...booking,
        expiresAt: Date.now() + TEN_YEARS_MS,
      },
      ...memoryBookings.filter((b) => b && b.id !== booking.id),
    ];
    memoryBookings = fallback;
    return fallback;
  }
}

export async function getLatestValidBooking(): Promise<Booking | null> {
  try {
    const all = await loadBookingsFromStorage();
    if (!all || all.length === 0) return null;

    const valid = all.filter((b: Booking) => {
      return b && typeof b === 'object' && b.outboundFlight;
    });

    return valid.length > 0 ? valid[0] : null;
  } catch (err) {
    return memoryBookings.length > 0 ? memoryBookings[0] : null;
  }
}

export async function cancelBookingInStorage(bookingId: string): Promise<Booking[]> {
  try {
    const existing = await loadBookingsFromStorage();
    const safeExisting = Array.isArray(existing) ? existing : [];
    const updated = safeExisting.map((b) =>
      b && b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    memoryBookings = updated;
    await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Notice cancelling booking in AsyncStorage, updated in memory', err);
    memoryBookings = memoryBookings.map((b) =>
      b && b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    return memoryBookings;
  }
}

export async function clearAllBookings(): Promise<void> {
  try {
    memoryBookings = [];
    await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear bookings from AsyncStorage', err);
  }
}

export async function saveRecentSearch(search: SearchParams): Promise<void> {
  try {
    if (!search?.origin || !search?.destination) return;
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    let searches: Array<{ originCode: string; destCode: string; date: string }> = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        searches = parsed;
      }
    }

    searches = searches.filter(
      (s) => s && !(s.originCode === search.origin?.code && s.destCode === search.destination?.code)
    );

    searches.unshift({
      originCode: search.origin.code,
      destCode: search.destination.code,
      date: search.departureDate,
    });

    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 5)));
  } catch (err) {
    console.warn('Failed to save recent search', err);
  }
}

export async function getRecentSearches(): Promise<Array<{ originCode: string; destCode: string; date: string }>> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
