import { Airport } from '../types/flight';

export const AIRPORTS: Airport[] = [
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    popular: true,
  },
  {
    code: 'LHR',
    name: 'Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    popular: true,
  },
  {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    flag: '🇺🇸',
    timezone: 'America/Los_Angeles',
    popular: true,
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    timezone: 'Europe/Paris',
    popular: true,
  },
  {
    code: 'HND',
    name: 'Haneda Airport (Tokyo International)',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    timezone: 'Asia/Tokyo',
    popular: true,
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    timezone: 'Asia/Dubai',
    popular: true,
  },
  {
    code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    timezone: 'Asia/Singapore',
    popular: true,
  },
  {
    code: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    flag: '🇳🇱',
    timezone: 'Europe/Amsterdam',
    popular: true,
  },
  {
    code: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    popular: true,
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    flag: '🇺🇸',
    timezone: 'America/Los_Angeles',
    popular: true,
  },
  {
    code: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    timezone: 'Australia/Sydney',
    popular: true,
  },
  {
    code: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    flag: '🇺🇸',
    timezone: 'America/Chicago',
  },
  {
    code: 'BCN',
    name: 'Josep Tarradellas Barcelona-El Prat Airport',
    city: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    timezone: 'Europe/Madrid',
  },
  {
    code: 'FCO',
    name: 'Leonardo da Vinci-Fiumicino Airport',
    city: 'Rome',
    country: 'Italy',
    flag: '🇮🇹',
    timezone: 'Europe/Rome',
  },
  {
    code: 'BER',
    name: 'Berlin Brandenburg Airport',
    city: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
  },
  {
    code: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    country: 'Qatar',
    flag: '🇶🇦',
    timezone: 'Asia/Qatar',
  },
  {
    code: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong',
    flag: '🇭🇰',
    timezone: 'Asia/Hong_Kong',
  },
  {
    code: 'ICN',
    name: 'Incheon International Airport',
    city: 'Seoul',
    country: 'South Korea',
    flag: '🇰🇷',
    timezone: 'Asia/Seoul',
  },
  {
    code: 'YYZ',
    name: 'Toronto Pearson International Airport',
    city: 'Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    timezone: 'America/Toronto',
  },
  {
    code: 'ZRH',
    name: 'Zurich Airport',
    city: 'Zurich',
    country: 'Switzerland',
    flag: '🇨🇭',
    timezone: 'Europe/Zurich',
  },
];

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code.toUpperCase() === code.toUpperCase());
}

export function searchAirports(query: string): Airport[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return AIRPORTS.filter((a) => a.popular);

  return AIRPORTS.filter((a) => {
    return (
      a.code.toLowerCase().includes(clean) ||
      a.city.toLowerCase().includes(clean) ||
      a.country.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean)
    );
  });
}
