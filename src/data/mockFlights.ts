import { Airport, Flight, FlightLeg, CabinClass } from '../types/flight';
import { getAirportByCode } from './airports';

export interface AirlineConfig {
  code: string;
  name: string;
  brandColor: string;
  aircraftTypes: string[];
}

export const AIRLINES: AirlineConfig[] = [
  {
    code: 'BA',
    name: 'British Airways',
    brandColor: '#075AAA',
    aircraftTypes: ['Boeing 787-9 Dreamliner', 'Airbus A350-1000', 'Boeing 777-300ER'],
  },
  {
    code: 'DL',
    name: 'Delta Air Lines',
    brandColor: '#B41829',
    aircraftTypes: ['Airbus A350-900', 'Boeing 767-400ER', 'Airbus A330-900neo'],
  },
  {
    code: 'SQ',
    name: 'Singapore Airlines',
    brandColor: '#C49746',
    aircraftTypes: ['Airbus A350-900 Ultra Long Range', 'Boeing 777-300ER'],
  },
  {
    code: 'EK',
    name: 'Emirates',
    brandColor: '#D71A21',
    aircraftTypes: ['Airbus A380-800', 'Boeing 777-300ER'],
  },
  {
    code: 'AF',
    name: 'Air France',
    brandColor: '#002157',
    aircraftTypes: ['Airbus A350-900', 'Boeing 777-200ER', 'Airbus A330-200'],
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    brandColor: '#05164D',
    aircraftTypes: ['Boeing 747-8 Intercontinental', 'Airbus A350-900'],
  },
  {
    code: 'VS',
    name: 'Virgin Atlantic',
    brandColor: '#CC0000',
    aircraftTypes: ['Airbus A350-1000', 'Boeing 787-9'],
  },
  {
    code: 'QR',
    name: 'Qatar Airways',
    brandColor: '#5C0632',
    aircraftTypes: ['Airbus A350-1000', 'Boeing 777-300ER'],
  },
];

// Helper to seed pseudorandom numbers based on route
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates an extensive list of 15-25 realistic flights between two airports.
 */
export function generateMockFlights(
  origin: Airport,
  destination: Airport,
  departureDate: string,
  cabinClass: CabinClass = 'economy'
): Flight[] {
  // If same origin & destination, return empty (validated at search, but safe check)
  if (origin.code === destination.code) {
    return [];
  }

  const baseKey = `${origin.code}-${destination.code}-${departureDate}-${cabinClass}`;
  const seed = simpleHash(baseKey);

  // Cabin multiplier
  const cabinPriceMultipliers: Record<CabinClass, number> = {
    economy: 1.0,
    premium_economy: 1.65,
    business: 3.2,
    first: 5.8,
  };
  const multiplier = cabinPriceMultipliers[cabinClass];

  // Base flight templates across the day
  const timeSlots = [
    { hour: 6, min: 15, baseDur: 440, stops: 0 },
    { hour: 7, min: 45, baseDur: 620, stops: 1, layoverAirport: 'AMS', layoverMins: 110 },
    { hour: 8, min: 30, baseDur: 430, stops: 0 },
    { hour: 9, min: 10, baseDur: 680, stops: 1, layoverAirport: 'FRA', layoverMins: 140 },
    { hour: 11, min: 0, baseDur: 450, stops: 0 },
    { hour: 12, min: 30, baseDur: 710, stops: 1, layoverAirport: 'CDG', layoverMins: 130 },
    { hour: 14, min: 15, baseDur: 460, stops: 0 },
    { hour: 15, min: 45, baseDur: 750, stops: 1, layoverAirport: 'LHR', layoverMins: 150 },
    { hour: 17, min: 20, baseDur: 435, stops: 0 },
    { hour: 18, min: 50, baseDur: 630, stops: 1, layoverAirport: 'DXB', layoverMins: 105 },
    { hour: 20, min: 15, baseDur: 445, stops: 0 },
    { hour: 21, min: 40, baseDur: 790, stops: 2, layoverAirport: 'AMS', layoverMins: 90, layover2Airport: 'FRA', layover2Mins: 110 },
    { hour: 22, min: 30, baseDur: 440, stops: 0 },
    { hour: 23, min: 15, baseDur: 660, stops: 1, layoverAirport: 'DOH', layoverMins: 125 },
  ];

  const flights: Flight[] = [];

  timeSlots.forEach((slot, index) => {
    const airline = AIRLINES[(index + seed) % AIRLINES.length];
    const aircraft = airline.aircraftTypes[(index + 1) % airline.aircraftTypes.length];
    const flightNum = `${airline.code} ${Math.floor(100 + ((index * 37 + seed) % 890))}`;

    // Departure time format
    const depDate = new Date(`${departureDate}T00:00:00`);
    depDate.setHours(slot.hour, slot.min, 0, 0);

    const arrDate = new Date(depDate.getTime() + slot.baseDur * 60 * 1000);

    // Dynamic price calculation
    const baseBase = 320 + ((index * 47 + seed) % 290);
    const nonStopPremium = slot.stops === 0 ? 95 : 0;
    const finalBasePrice = Math.round((baseBase + nonStopPremium) * multiplier);
    const finalTaxes = Math.round(finalBasePrice * 0.14 + 32);

    // Legs and layovers
    const legs: FlightLeg[] = [];
    const layovers = [];

    if (slot.stops === 0) {
      legs.push({
        id: `leg-${index}-1`,
        flightNumber: flightNum,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft,
        departureAirport: origin,
        arrivalAirport: destination,
        departureTime: depDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        durationMinutes: slot.baseDur,
        terminalDep: 'T' + (((index + 1) % 4) + 1),
        terminalArr: 'T' + (((index + 2) % 4) + 1),
      });
    } else if (slot.stops === 1) {
      // 1 stop
      const layoverAirport = getAirportByCode(slot.layoverAirport || 'AMS') || {
        code: slot.layoverAirport || 'AMS',
        name: 'Connecting Hub Airport',
        city: 'Connecting City',
        country: 'Transit',
        flag: '✈️',
        timezone: 'UTC',
      };

      const leg1Dur = Math.round((slot.baseDur - (slot.layoverMins || 120)) * 0.52);
      const leg2Dur = slot.baseDur - (slot.layoverMins || 120) - leg1Dur;

      const leg1ArrDate = new Date(depDate.getTime() + leg1Dur * 60 * 1000);
      const leg2DepDate = new Date(leg1ArrDate.getTime() + (slot.layoverMins || 120) * 60 * 1000);

      legs.push({
        id: `leg-${index}-1`,
        flightNumber: flightNum,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft,
        departureAirport: origin,
        arrivalAirport: layoverAirport,
        departureTime: depDate.toISOString(),
        arrivalTime: leg1ArrDate.toISOString(),
        durationMinutes: leg1Dur,
        terminalDep: 'T' + (((index + 1) % 4) + 1),
        terminalArr: 'T1',
      });

      legs.push({
        id: `leg-${index}-2`,
        flightNumber: `${airline.code} ${Math.floor(200 + ((index * 41 + seed) % 700))}`,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft: airline.aircraftTypes[0],
        departureAirport: layoverAirport,
        arrivalAirport: destination,
        departureTime: leg2DepDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        durationMinutes: leg2Dur,
        terminalDep: 'T1',
        terminalArr: 'T' + (((index + 3) % 4) + 1),
      });

      layovers.push({
        airport: layoverAirport,
        durationMinutes: slot.layoverMins || 120,
        isOvernight: false,
      });
    } else {
      // 2 stops
      const layover1 = getAirportByCode('AMS')!;
      const layover2 = getAirportByCode('FRA')!;
      const leg1Dur = 180;
      const leg2Dur = 220;
      const leg3Dur = 190;

      const t1 = new Date(depDate.getTime() + leg1Dur * 60 * 1000);
      const t2 = new Date(t1.getTime() + 90 * 60 * 1000);
      const t3 = new Date(t2.getTime() + leg2Dur * 60 * 1000);
      const t4 = new Date(t3.getTime() + 110 * 60 * 1000);

      legs.push({
        id: `leg-${index}-1`,
        flightNumber: flightNum,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft,
        departureAirport: origin,
        arrivalAirport: layover1,
        departureTime: depDate.toISOString(),
        arrivalTime: t1.toISOString(),
        durationMinutes: leg1Dur,
      });
      legs.push({
        id: `leg-${index}-2`,
        flightNumber: `${airline.code} 382`,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft: airline.aircraftTypes[1] || aircraft,
        departureAirport: layover1,
        arrivalAirport: layover2,
        departureTime: t2.toISOString(),
        arrivalTime: t3.toISOString(),
        durationMinutes: leg2Dur,
      });
      legs.push({
        id: `leg-${index}-3`,
        flightNumber: `${airline.code} 591`,
        airlineCode: airline.code,
        airlineName: airline.name,
        aircraft: airline.aircraftTypes[0] || aircraft,
        departureAirport: layover2,
        arrivalAirport: destination,
        departureTime: t4.toISOString(),
        arrivalTime: arrDate.toISOString(),
        durationMinutes: leg3Dur,
      });

      layovers.push(
        { airport: layover1, durationMinutes: 90 },
        { airport: layover2, durationMinutes: 110 }
      );
    }

    const amenitiesMap: Record<CabinClass, string[]> = {
      economy: ['In-seat USB power', 'Complimentary snacks & drinks', 'Personal seatback screen'],
      premium_economy: ['High-speed satellite WiFi', 'Extra 7" legroom', 'Premium hot meal service', 'Priority boarding'],
      business: ['Direct aisle access lie-flat bed', 'Fast unlimited WiFi', 'Chef-curated 3-course dining', 'Lounge access included'],
      first: ['Private enclosed suite', 'Caviar & vintage champagne service', 'Chauffeur airport transfer', 'Dedicated personal concierge'],
    };

    flights.push({
      id: `fl-${airline.code.toLowerCase()}-${index}-${seed}`,
      airlineCode: airline.code,
      airlineName: airline.name,
      airlineLogoColor: airline.brandColor,
      flightNumber: flightNum,
      aircraft,
      departureAirport: origin,
      arrivalAirport: destination,
      departureTime: depDate.toISOString(),
      arrivalTime: arrDate.toISOString(),
      durationMinutes: slot.baseDur,
      stops: slot.stops,
      layovers,
      legs,
      basePrice: finalBasePrice,
      taxes: finalTaxes,
      cabinClass,
      baggage: {
        personalItem: true,
        carryOn: cabinClass !== 'economy' || index % 3 !== 0,
        checkedBagCount: cabinClass === 'economy' ? (index % 2 === 0 ? 0 : 1) : cabinClass === 'premium_economy' ? 1 : 2,
        checkedBagKg: 23,
        extraBagFee: 45,
      },
      amenities: amenitiesMap[cabinClass],
      fareConditions: {
        refundable: cabinClass === 'business' || cabinClass === 'first' || index % 4 === 0,
        changeAllowed: true,
        changeFee: cabinClass === 'business' || cabinClass === 'first' ? 0 : 60,
        cancellationNotice: 'Free cancellation within 24 hours of booking',
      },
      seatsAvailable: 4 + ((index * 3 + seed) % 9),
      carbonEmissionsKg: Math.round(slot.baseDur * 0.42 + (slot.stops === 0 ? 0 : 45)),
      isPopularChoice: index === 0 || index === 2,
    });
  });

  return flights;
}
