import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  Plane,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Users,
  Search,
  Check,
  AlertCircle,
  X,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Airport, SearchParams, CabinClass, PassengerCount } from '../../types/flight';
import { AIRPORTS, searchAirports } from '../../data/airports';
import {
  getTodayDateString,
  getFutureDateString,
  isDateInPast,
  formatFlightDate,
} from '../../utils/formatters';

interface SearchScreenProps {
  initialParams: SearchParams;
  onSearch: (params: SearchParams) => void;
  onSelectRecentSearch?: (originCode: string, destCode: string, date: string) => void;
}

const POPULAR_ROUTES = [
  {
    fromCode: 'JFK',
    toCode: 'LHR',
    fromCity: 'New York',
    toCity: 'London',
    price: 420,
    airline: 'British Airways',
    daysAhead: 5,
  },
  {
    fromCode: 'DXB',
    toCode: 'SIN',
    fromCity: 'Dubai',
    toCity: 'Singapore',
    price: 540,
    airline: 'Emirates',
    daysAhead: 7,
  },
  {
    fromCode: 'CDG',
    toCode: 'HND',
    fromCity: 'Paris',
    toCity: 'Tokyo',
    price: 690,
    airline: 'Air France',
    daysAhead: 10,
  },
  {
    fromCode: 'SFO',
    toCode: 'HND',
    fromCity: 'San Francisco',
    toCity: 'Tokyo',
    price: 740,
    airline: 'ANA',
    daysAhead: 8,
  },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialParams,
  onSearch,
}) => {
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>(initialParams.tripType);
  const [origin, setOrigin] = useState<Airport | null>(initialParams.origin);
  const [destination, setDestination] = useState<Airport | null>(initialParams.destination);
  const [departureDate, setDepartureDate] = useState<string>(
    initialParams.departureDate || getFutureDateString(3)
  );
  const [returnDate, setReturnDate] = useState<string>(
    initialParams.returnDate || getFutureDateString(10)
  );
  const [passengers, setPassengers] = useState<PassengerCount>(initialParams.passengers);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialParams.cabinClass);

  // Modals
  const [pickerMode, setPickerMode] = useState<'origin' | 'destination' | null>(null);
  const [airportSearchQuery, setAirportSearchQuery] = useState('');
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState<'departure' | 'return' | null>(null);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setValidationError(null);
  };

  const validate = (): boolean => {
    if (!origin) {
      setValidationError('Please select an origin departure airport.');
      return false;
    }
    if (!destination) {
      setValidationError('Please select a destination arrival airport.');
      return false;
    }
    if (origin.code === destination.code) {
      setValidationError('Origin and destination airports cannot be identical.');
      return false;
    }
    if (!departureDate) {
      setValidationError('Please select a departure date.');
      return false;
    }
    if (isDateInPast(departureDate)) {
      setValidationError('Departure date cannot occur in the past.');
      return false;
    }
    if (tripType === 'roundTrip') {
      if (!returnDate) {
        setValidationError('Please select a return date for your round trip.');
        return false;
      }
      if (returnDate <= departureDate) {
        setValidationError('Return date must be after the departure date.');
        return false;
      }
    }
    if (passengers.adults < 1) {
      setValidationError('At least one adult passenger is required.');
      return false;
    }
    if (passengers.infants > passengers.adults) {
      setValidationError('Each infant must be accompanied by at least one adult passenger.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSearchSubmit = () => {
    if (!validate()) return;
    if (!origin || !destination) return;

    onSearch({
      tripType,
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'roundTrip' ? returnDate : undefined,
      passengers,
      cabinClass,
    });
  };

  const handleSelectPopularRoute = (route: typeof POPULAR_ROUTES[0]) => {
    const fromAirport = AIRPORTS.find((a) => a.code === route.fromCode) || null;
    const toAirport = AIRPORTS.find((a) => a.code === route.toCode) || null;
    if (fromAirport && toAirport) {
      setOrigin(fromAirport);
      setDestination(toAirport);
      const dep = getFutureDateString(route.daysAhead);
      setDepartureDate(dep);
      if (tripType === 'roundTrip') {
        setReturnDate(getFutureDateString(route.daysAhead + 7));
      }
      setValidationError(null);
    }
  };

  const filteredAirports = searchAirports(airportSearchQuery);
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  // Calendar rendering helper
  const renderCalendarDays = () => {
    const today = new Date();
    const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const selectedTargetDate = showDateModal === 'departure' ? departureDate : returnDate;
    const minSelectableDate = showDateModal === 'return' ? departureDate : getTodayDateString();

    const dayCells: React.ReactNode[] = [];

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<View key={`empty-${i}`} style={styles.calDayCell} />);
    }

    // Actual month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dayStr < minSelectableDate;
      const isSelected = dayStr === selectedTargetDate;
      const isToday = dayStr === getTodayDateString();

      dayCells.push(
        <TouchableOpacity
          key={dayStr}
          style={[
            styles.calDayCell,
            isSelected && styles.calDayCellSelected,
            isToday && !isSelected && styles.calDayCellToday,
          ]}
          disabled={isPast}
          onPress={() => {
            if (showDateModal === 'departure') {
              setDepartureDate(dayStr);
              if (tripType === 'roundTrip' && returnDate <= dayStr) {
                setReturnDate(getFutureDateString(7));
              }
            } else {
              setReturnDate(dayStr);
            }
            setShowDateModal(null);
            setValidationError(null);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.calDayText,
              isPast && styles.calDayTextDisabled,
              isSelected && styles.calDayTextSelected,
              isToday && !isSelected && styles.calDayTextToday,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarWrapper}>
        <View style={styles.calMonthNav}>
          <TouchableOpacity
            style={[styles.calNavBtn, calendarMonthOffset <= 0 && styles.calNavBtnDisabled]}
            disabled={calendarMonthOffset <= 0}
            onPress={() => setCalendarMonthOffset((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft size={20} color={calendarMonthOffset <= 0 ? '#cbd5e1' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={styles.calMonthTitle}>{monthName}</Text>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={() => setCalendarMonthOffset((prev) => Math.min(11, prev + 1))}
          >
            <ChevronRight size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.calWeekRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <Text key={d} style={styles.calWeekHeader}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calGrid}>{dayCells}</View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Plane size={22} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.brandName}>Morfikos Flights</Text>
            <Text style={styles.brandTagline}>Premium Global Flight Booking</Text>
          </View>
        </View>
      </View>

      {/* Main Search Card */}
      <View style={styles.searchCard}>
        {/* Trip Type Segmented Tabs */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentedTab, tripType === 'oneWay' && styles.segmentedTabActive]}
            onPress={() => setTripType('oneWay')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentedLabel, tripType === 'oneWay' && styles.segmentedLabelActive]}>
              One Way
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentedTab, tripType === 'roundTrip' && styles.segmentedTabActive]}
            onPress={() => setTripType('roundTrip')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentedLabel, tripType === 'roundTrip' && styles.segmentedLabelActive]}>
              Round Trip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connected Flight Route Selector (Origin & Destination) */}
        <View style={styles.routeContainer}>
          {/* Origin Airport Input */}
          <TouchableOpacity
            style={styles.airportCard}
            onPress={() => {
              setPickerMode('origin');
              setAirportSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.routeSideIndicator}>
              <View style={styles.originIndicatorDot} />
              <View style={styles.connectorLine} />
            </View>
            <View style={styles.airportDetails}>
              <Text style={styles.fieldLabel}>DEPARTING FROM</Text>
              {origin ? (
                <View>
                  <View style={styles.codeRow}>
                    <Text style={styles.airportCode}>{origin.code}</Text>
                    <Text style={styles.flagEmoji}>{origin.flag}</Text>
                  </View>
                  <Text style={styles.airportSub} numberOfLines={1}>
                    {origin.city} • {origin.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyPrompt}>Choose origin city or airport...</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Swap Button (Properly Centered on Route Divider) */}
          <View style={styles.swapButtonWrapper}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapAirports}
              activeOpacity={0.85}
              accessibilityLabel="Swap departure and destination"
            >
              <ArrowUpDown size={18} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {/* Destination Airport Input */}
          <TouchableOpacity
            style={styles.airportCard}
            onPress={() => {
              setPickerMode('destination');
              setAirportSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.routeSideIndicator}>
              <View style={styles.destIndicatorPin} />
            </View>
            <View style={styles.airportDetails}>
              <Text style={styles.fieldLabel}>FLYING TO</Text>
              {destination ? (
                <View>
                  <View style={styles.codeRow}>
                    <Text style={styles.airportCode}>{destination.code}</Text>
                    <Text style={styles.flagEmoji}>{destination.flag}</Text>
                  </View>
                  <Text style={styles.airportSub} numberOfLines={1}>
                    {destination.city} • {destination.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyPrompt}>Choose destination city or airport...</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Dates Section */}
        <View style={styles.datesRow}>
          {/* Departure Date Card */}
          <TouchableOpacity
            style={[styles.inputBox, tripType === 'oneWay' ? styles.inputBoxFull : styles.inputBoxHalf]}
            onPress={() => {
              setShowDateModal('departure');
              setCalendarMonthOffset(0);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.inputBoxHeader}>
              <CalendarIcon size={15} color="#2563eb" />
              <Text style={styles.inputBoxLabel}>DEPARTURE</Text>
            </View>
            <Text style={styles.dateMainText}>{formatFlightDate(departureDate)}</Text>
            <Text style={styles.dateSubText}>{departureDate}</Text>
          </TouchableOpacity>

          {/* Return Date Card (if Round Trip) */}
          {tripType === 'roundTrip' && (
            <TouchableOpacity
              style={[styles.inputBox, styles.inputBoxHalf]}
              onPress={() => {
                setShowDateModal('return');
                setCalendarMonthOffset(0);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.inputBoxHeader}>
                <CalendarIcon size={15} color="#2563eb" />
                <Text style={styles.inputBoxLabel}>RETURN</Text>
              </View>
              <Text style={styles.dateMainText}>{formatFlightDate(returnDate)}</Text>
              <Text style={styles.dateSubText}>{returnDate}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Travelers and Cabin Class Selection */}
        <View style={styles.preferencesRow}>
          {/* Travelers Box */}
          <TouchableOpacity
            style={styles.preferenceBox}
            onPress={() => setShowPassengerModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.inputBoxHeader}>
              <Users size={15} color="#2563eb" />
              <Text style={styles.inputBoxLabel}>TRAVELERS</Text>
            </View>
            <Text style={styles.prefValueText}>
              {totalPassengers} {totalPassengers === 1 ? 'Traveler' : 'Travelers'}
            </Text>
            <Text style={styles.prefSubText}>
              {passengers.adults} Adult{passengers.adults > 1 ? 's' : ''}
              {passengers.children > 0 ? `, ${passengers.children} Child` : ''}
              {passengers.infants > 0 ? `, ${passengers.infants} Infant` : ''}
            </Text>
          </TouchableOpacity>

          {/* Cabin Class Box */}
          <View style={styles.preferenceBox}>
            <Text style={styles.inputBoxLabel}>CABIN CLASS</Text>
            <View style={styles.cabinClassSelector}>
              {(['economy', 'business'] as CabinClass[]).map((c) => {
                const isActive = cabinClass === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cabinOption, isActive && styles.cabinOptionActive]}
                    onPress={() => setCabinClass(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cabinOptionText, isActive && styles.cabinOptionTextActive]}>
                      {c === 'economy' ? 'Economy' : 'Business'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Error Notification */}
        {validationError && (
          <View style={styles.errorAlert}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorAlertText}>{validationError}</Text>
          </View>
        )}

        {/* Primary CTA Search Button */}
        <TouchableOpacity
          style={styles.searchSubmitButton}
          onPress={handleSearchSubmit}
          activeOpacity={0.85}
        >
          <Search size={20} color="#ffffff" style={styles.searchBtnIcon} />
          <Text style={styles.searchSubmitText}>Find Available Flights</Text>
        </TouchableOpacity>
      </View>

      {/* Trust & Features Strip */}
      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <ShieldCheck size={20} color="#2563eb" />
          <Text style={styles.trustTitle}>Best Price Guarantee</Text>
          <Text style={styles.trustDesc}>Zero hidden processing fees</Text>
        </View>
        <View style={styles.trustItem}>
          <Clock size={20} color="#2563eb" />
          <Text style={styles.trustTitle}>24h Cancellation</Text>
          <Text style={styles.trustDesc}>Instant refund eligibility</Text>
        </View>
      </View>

      {/* Popular Direct Routes */}
      <View style={styles.popularSection}>
        <View style={styles.sectionHeaderRow}>
          <Sparkles size={16} color="#2563eb" />
          <Text style={styles.sectionTitle}>Popular Direct Routes</Text>
        </View>

        <View style={styles.routesGrid}>
          {POPULAR_ROUTES.map((route) => (
            <TouchableOpacity
              key={`${route.fromCode}-${route.toCode}`}
              style={styles.routeCard}
              onPress={() => handleSelectPopularRoute(route)}
              activeOpacity={0.7}
            >
              <View style={styles.routeCardTop}>
                <Text style={styles.routeCodePair}>
                  {route.fromCode} → {route.toCode}
                </Text>
                <Text style={styles.routeFareText}>from ${route.price}</Text>
              </View>
              <Text style={styles.routeCitiesText}>
                {route.fromCity} to {route.toCity}
              </Text>
              <Text style={styles.routeAirlineText}>{route.airline} • Direct</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Airport Selection Modal */}
      <Modal
        visible={pickerMode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPickerMode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>
                  {pickerMode === 'origin' ? 'Select Departure Airport' : 'Select Arrival Airport'}
                </Text>
                <Text style={styles.modalSheetSub}>Choose from world international gateways</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPickerMode(null)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search city, country, or 3-letter IATA code..."
                placeholderTextColor="#94a3b8"
                value={airportSearchQuery}
                onChangeText={setAirportSearchQuery}
                autoFocus={true}
              />
              {airportSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setAirportSearchQuery('')}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.airportList} keyboardShouldPersistTaps="handled">
              {filteredAirports.map((airport) => {
                const isSelected =
                  (pickerMode === 'origin' && origin?.code === airport.code) ||
                  (pickerMode === 'destination' && destination?.code === airport.code);

                return (
                  <TouchableOpacity
                    key={airport.code}
                    style={[styles.airportRow, isSelected && styles.airportRowSelected]}
                    onPress={() => {
                      if (pickerMode === 'origin') setOrigin(airport);
                      else setDestination(airport);
                      setPickerMode(null);
                      setValidationError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.airportRowBadge}>
                      <Text style={styles.airportRowCode}>{airport.code}</Text>
                    </View>
                    <View style={styles.airportRowInfo}>
                      <View style={styles.airportRowCityLine}>
                        <Text style={styles.airportRowCity}>{airport.city}</Text>
                        <Text style={styles.airportRowFlag}>{airport.flag}</Text>
                      </View>
                      <Text style={styles.airportRowName} numberOfLines={1}>
                        {airport.name}, {airport.country}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDateModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.datePickerSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>
                  {showDateModal === 'departure' ? 'Select Departure Date' : 'Select Return Date'}
                </Text>
                <Text style={styles.modalSheetSub}>Choose a date or quick preset</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDateModal(null)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 Days', days: 3 },
                { label: 'Next Week', days: 7 },
                { label: 'In 2 Weeks', days: 14 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetChip}
                  onPress={() => {
                    const chosen = getFutureDateString(preset.days);
                    if (showDateModal === 'departure') {
                      setDepartureDate(chosen);
                      if (tripType === 'roundTrip' && returnDate <= chosen) {
                        setReturnDate(getFutureDateString(preset.days + 7));
                      }
                    } else {
                      setReturnDate(chosen);
                    }
                    setShowDateModal(null);
                    setValidationError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interactive Calendar Days */}
            {renderCalendarDays()}

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowDateModal(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Passenger Selection Modal */}
      <Modal
        visible={showPassengerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPassengerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.passengersSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>Select Travelers</Text>
                <Text style={styles.modalSheetSub}>Maximum 9 passengers per booking</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowPassengerModal(false)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Adults */}
            <View style={styles.stepperItem}>
              <View>
                <Text style={styles.stepperTitle}>Adults</Text>
                <Text style={styles.stepperCaption}>Age 12 and above</Text>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={[styles.stepperButton, passengers.adults <= 1 && styles.stepperBtnDisabled]}
                  disabled={passengers.adults <= 1}
                  onPress={() => setPassengers((p) => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={passengers.adults <= 1 ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={styles.stepperNumber}>{passengers.adults}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setPassengers((p) => ({ ...p, adults: p.adults + 1 }))}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Children */}
            <View style={styles.stepperItem}>
              <View>
                <Text style={styles.stepperTitle}>Children</Text>
                <Text style={styles.stepperCaption}>Age 2 to 11 years</Text>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={[styles.stepperButton, passengers.children <= 0 && styles.stepperBtnDisabled]}
                  disabled={passengers.children <= 0}
                  onPress={() => setPassengers((p) => ({ ...p, children: Math.max(0, p.children - 1) }))}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={passengers.children <= 0 ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={styles.stepperNumber}>{passengers.children}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setPassengers((p) => ({ ...p, children: p.children + 1 }))}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Infants */}
            <View style={styles.stepperItem}>
              <View>
                <Text style={styles.stepperTitle}>Infants</Text>
                <Text style={styles.stepperCaption}>Under 2 years (in lap)</Text>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={[styles.stepperButton, passengers.infants <= 0 && styles.stepperBtnDisabled]}
                  disabled={passengers.infants <= 0}
                  onPress={() => setPassengers((p) => ({ ...p, infants: Math.max(0, p.infants - 1) }))}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={passengers.infants <= 0 ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={styles.stepperNumber}>{passengers.infants}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setPassengers((p) => ({ ...p, infants: p.infants + 1 }))}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowPassengerModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmBtnText}>Apply ({totalPassengers} Travelers)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentedTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentedLabelActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  routeContainer: {
    position: 'relative',
    marginBottom: 14,
    gap: 10,
  },
  airportCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  routeSideIndicator: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
  },
  originIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  connectorLine: {
    width: 2,
    height: 22,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
  },
  destIndicatorPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  airportDetails: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748b',
    marginBottom: 3,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airportCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  flagEmoji: {
    fontSize: 18,
  },
  airportSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  emptyPrompt: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  swapButtonWrapper: {
    position: 'absolute',
    right: 18,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inputBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
  },
  inputBoxFull: {
    flex: 1,
  },
  inputBoxHalf: {
    flex: 1,
  },
  inputBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  inputBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748b',
  },
  dateMainText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  dateSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  preferencesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  preferenceBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
  },
  prefValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  prefSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cabinClassSelector: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
    marginTop: 6,
  },
  cabinOption: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 6,
  },
  cabinOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cabinOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  cabinOptionTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },
  searchSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBtnIcon: {
    marginRight: 8,
  },
  searchSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  trustStrip: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  trustItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  trustDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  popularSection: {
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  routesGrid: {
    gap: 10,
  },
  routeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  routeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeCodePair: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  routeFareText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  routeCitiesText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  routeAirlineText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  datePickerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  passengersSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSheetSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  airportList: {
    maxHeight: 380,
  },
  airportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  airportRowSelected: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  airportRowBadge: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  airportRowCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  airportRowInfo: {
    flex: 1,
  },
  airportRowCityLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  airportRowCity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  airportRowFlag: {
    fontSize: 14,
  },
  airportRowName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  calendarWrapper: {
    marginBottom: 16,
  },
  calMonthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnDisabled: {
    opacity: 0.4,
  },
  calMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calWeekHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellSelected: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
  },
  calDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 20,
  },
  calDayText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  calDayTextDisabled: {
    color: '#cbd5e1',
  },
  calDayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  calDayTextToday: {
    color: '#2563eb',
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepperItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepperTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepperCaption: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stepperActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepperBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
  },
  stepperNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 20,
    textAlign: 'center',
  },
});
