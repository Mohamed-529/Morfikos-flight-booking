import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  LogBox,
  BackHandler,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Plane, Compass, Luggage } from 'lucide-react-native';

// Suppress all development warning overlays and yellow boxes on mobile screens
LogBox.ignoreAllLogs(true);


import {
  Flight,
  SearchParams,
  PassengerInfo,
  Booking,
  FlowStep,
} from './types/flight';
import { AIRPORTS } from './data/airports';
import { searchFlightsApi, generateSeatMap } from './services/flightApi';
import {
  loadBookingsFromStorage,
  saveBookingToStorage,
  cancelBookingInStorage,
} from './services/storage';
import {
  getFutureDateString,
  generateBookingReference,
  isDateInPast,
} from './utils/formatters';

import { SearchScreen } from './components/search/SearchScreen';
import { ResultsScreen } from './components/results/ResultsScreen';
import { FlightDetailScreen } from './components/detail/FlightDetailScreen';
import { SeatSelectionScreen } from './components/seatmap/SeatSelectionScreen';
import { PassengerFormScreen } from './components/passengers/PassengerFormScreen';
import { PaymentScreen } from './components/payment/PaymentScreen';
import { ConfirmationScreen } from './components/confirmation/ConfirmationScreen';
import { MyTripsScreen } from './components/trips/MyTripsScreen';

export default function App() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('search');
  const [activeTab, setActiveTab] = useState<'book' | 'trips'>('book');

  // Search State
  const defaultOrigin = AIRPORTS.find((a) => a.code === 'JFK') || AIRPORTS[0];
  const defaultDestination = AIRPORTS.find((a) => a.code === 'LHR') || AIRPORTS[1];

  const [searchParams, setSearchParams] = useState<SearchParams>({
    tripType: 'oneWay',
    origin: defaultOrigin,
    destination: defaultDestination,
    departureDate: getFutureDateString(3),
    returnDate: getFutureDateString(10),
    passengers: { adults: 1, children: 0, infants: 0 },
    cabinClass: 'economy',
  });

  // Flights API State
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [flightsError, setFlightsError] = useState<string | null>(null);

  // Active Flow Selections
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, string>>({});
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Persisted Bookings from Storage
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Initial load from AsyncStorage
  useEffect(() => {
    loadBookingsFromStorage().then((loaded) => {
      if (Array.isArray(loaded)) {
        setBookings(loaded);
      }
    });

    // Dismiss any development loading banner at the top
    try {
      const { TurboModuleRegistry, NativeModules } = require('react-native');
      const devLoading =
        TurboModuleRegistry?.get?.('DevLoadingView') || NativeModules?.DevLoadingView;
      if (devLoading) {
        devLoading.hide?.();
        devLoading.showMessage = () => {};
      }
    } catch (e) {}
  }, []);

  // Native Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBack = () => {
      if (currentStep === 'results') {
        setCurrentStep('search');
        return true;
      }
      if (currentStep === 'flight_detail') {
        setCurrentStep('results');
        return true;
      }
      if (currentStep === 'seat_selection') {
        setCurrentStep('flight_detail');
        return true;
      }
      if (currentStep === 'passenger_details') {
        setCurrentStep('seat_selection');
        return true;
      }
      if (currentStep === 'payment') {
        setCurrentStep('passenger_details');
        return true;
      }
      if (currentStep === 'confirmation' || currentStep === 'my_trips') {
        setCurrentStep('search');
        setActiveTab('book');
        return true;
      }
      return false;
    };

    if (Platform.OS !== 'android' || !BackHandler?.addEventListener) {
      return;
    }

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backSub.remove();
  }, [currentStep]);

  const triggerHaptic = (ms = 12) => {
    try {
      Vibration.vibrate(ms);
    } catch (e) {}
  };

  // Search execution
  const executeSearch = async (params: SearchParams) => {
    setSearchParams(params);
    setCurrentStep('results');
    setIsLoadingFlights(true);
    setFlightsError(null);

    try {
      const results = await searchFlightsApi(params);
      setFlights(results);
    } catch (err: any) {
      setFlightsError(err.message || 'Unable to fetch flight data. Please try again.');
    } finally {
      setIsLoadingFlights(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);

    const initialPassengersList: PassengerInfo[] = [];
    let pIdx = 1;

    for (let i = 0; i < searchParams.passengers.adults; i++) {
      initialPassengersList.push({
        id: `p-${pIdx}`,
        type: 'adult',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        email: i === 0 ? '' : undefined,
        phone: i === 0 ? '' : undefined,
      });
      pIdx++;
    }

    for (let i = 0; i < searchParams.passengers.children; i++) {
      initialPassengersList.push({
        id: `p-${pIdx}`,
        type: 'child',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
      });
      pIdx++;
    }

    for (let i = 0; i < searchParams.passengers.infants; i++) {
      initialPassengersList.push({
        id: `p-${pIdx}`,
        type: 'infant',
        title: 'Ms',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'female',
      });
      pIdx++;
    }

    setPassengers(initialPassengersList);
    setSelectedSeats({});
    setCurrentStep('flight_detail');
  };

  const calculatePriceBreakdown = () => {
    if (!selectedFlight) {
      return {
        baseFare: 0,
        taxesAndFees: 0,
        passengerCount: 1,
        seatFees: 0,
        baggageFees: 0,
        total: 0,
      };
    }

    const adults = searchParams.passengers.adults;
    const children = searchParams.passengers.children;
    const infants = searchParams.passengers.infants;

    const baseAdult = selectedFlight.basePrice * adults;
    const baseChild = Math.round(selectedFlight.basePrice * 0.75) * children;
    const baseInfant = Math.round(selectedFlight.basePrice * 0.15) * infants;
    const totalBase = baseAdult + baseChild + baseInfant;

    const taxes = selectedFlight.taxes * (adults + children) + Math.round(selectedFlight.taxes * 0.2) * infants;

    const seatMap = generateSeatMap(selectedFlight);
    let seatFees = 0;
    Object.values(selectedSeats).forEach((seatId) => {
      const s = seatMap.find((item) => item.id === seatId);
      if (s) seatFees += s.price;
    });

    const total = totalBase + taxes + seatFees;

    return {
      baseFare: totalBase,
      taxesAndFees: taxes,
      passengerCount: adults + children + infants,
      seatFees,
      baggageFees: 0,
      total,
    };
  };

  const handlePaymentSuccess = async (paymentSummary: { brand: string; last4: string }) => {
    if (!selectedFlight) return;

    const breakdown = calculatePriceBreakdown();
    const referenceCode = generateBookingReference();

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      referenceCode,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      outboundFlight: selectedFlight,
      passengers,
      seats: selectedSeats,
      priceBreakdown: breakdown,
      status: 'confirmed',
      paymentSummary,
    };

    const updated = await saveBookingToStorage(newBooking);
    setBookings(updated);
    setCompletedBooking(newBooking);
    setCurrentStep('confirmation');
  };

  const handleCancelBooking = async (bookingId: string) => {
    const updated = await cancelBookingInStorage(bookingId);
    setBookings(updated);
  };

  const handleTabChange = (tab: 'book' | 'trips') => {
    triggerHaptic(15);
    setActiveTab(tab);
    if (tab === 'trips') {
      setCurrentStep('my_trips');
    } else {
      if (currentStep === 'my_trips') {
        setCurrentStep('search');
      }
    }
  };

  const handleResetApp = () => {
    setSelectedFlight(null);
    setPassengers([]);
    setSelectedSeats({});
    setCompletedBooking(null);
    setCurrentStep('search');
    setActiveTab('book');
  };

  // Trips badge count in bottom navigation
  const liveTripsCount = bookings.length;

  const isCheckoutStep = ['flight_detail', 'seat_selection', 'passenger_details', 'payment'].includes(currentStep);
  const showTabBar = !isCheckoutStep;

const initialMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          {/* Main Screens */}
          <View style={styles.screenContainer}>
            {currentStep === 'search' && (
              <SearchScreen
                initialParams={searchParams}
                onSearch={executeSearch}
              />
            )}

            {currentStep === 'results' && (
              <ResultsScreen
                searchParams={searchParams}
                flights={flights}
                isLoading={isLoadingFlights}
                error={flightsError}
                onRetry={() => executeSearch(searchParams)}
                onSelectFlight={handleSelectFlight}
                onBack={() => setCurrentStep('search')}
                onEditSearch={() => setCurrentStep('search')}
              />
            )}

            {currentStep === 'flight_detail' && selectedFlight && (
              <FlightDetailScreen
                flight={selectedFlight}
                searchParams={searchParams}
                selectedSeats={selectedSeats}
                onBack={() => setCurrentStep('results')}
                onContinue={() => setCurrentStep('seat_selection')}
              />
            )}

            {currentStep === 'seat_selection' && selectedFlight && (
              <SeatSelectionScreen
                flight={selectedFlight}
                passengers={passengers}
                selectedSeats={selectedSeats}
                onSaveSeats={(seats) => {
                  setSelectedSeats(seats);
                  setCurrentStep('passenger_details');
                }}
                onBack={() => setCurrentStep('flight_detail')}
                onSkip={() => setCurrentStep('passenger_details')}
              />
            )}

            {currentStep === 'passenger_details' && (
              <PassengerFormScreen
                searchParams={searchParams}
                initialPassengers={passengers}
                onSubmit={(validatedPassengers) => {
                  setPassengers(validatedPassengers);
                  setCurrentStep('payment');
                }}
                onBack={() => setCurrentStep('seat_selection')}
              />
            )}

            {currentStep === 'payment' && selectedFlight && (
              <PaymentScreen
                flight={selectedFlight}
                passengers={passengers}
                priceBreakdown={calculatePriceBreakdown()}
                selectedSeats={selectedSeats}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => setCurrentStep('passenger_details')}
              />
            )}

            {currentStep === 'confirmation' && (
              <ConfirmationScreen
                booking={completedBooking}
                onGoToTrips={() => {
                  setActiveTab('trips');
                  setCurrentStep('my_trips');
                }}
                onBookAnother={handleResetApp}
                onRedirectToHome={handleResetApp}
              />
            )}

            {currentStep === 'my_trips' && (
              <MyTripsScreen
                bookings={bookings}
                onCancelBooking={handleCancelBooking}
                onStartSearch={() => {
                  setActiveTab('book');
                  setCurrentStep('search');
                }}
              />
            )}
          </View>

          {/* Bottom Navigation Tab Bar */}
          {showTabBar && (
            <View style={styles.tabBar} accessibilityRole="tablist">
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'book' && styles.tabItemActive]}
                onPress={() => handleTabChange('book')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="Search Flights"
                accessibilityState={{ selected: activeTab === 'book' }}
              >
                <Compass size={22} color={activeTab === 'book' ? '#2563eb' : '#64748b'} />
                <Text style={[styles.tabLabel, activeTab === 'book' && styles.tabLabelActive]}>
                  Search
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'trips' && styles.tabItemActive]}
                onPress={() => handleTabChange('trips')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={`My Trips, ${liveTripsCount} bookings`}
                accessibilityState={{ selected: activeTab === 'trips' }}
              >
                <View style={styles.tabIconBadgeContainer}>
                  <Luggage size={22} color={activeTab === 'trips' ? '#2563eb' : '#64748b'} />
                  {liveTripsCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{liveTripsCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, activeTab === 'trips' && styles.tabLabelActive]}>
                  My Trips
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 6,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabItemActive: {},
  tabIconBadgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
