import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  Plane,
  Luggage,
  ShieldCheck,
  Wifi,
  Zap,
  Coffee,
  Tv,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Flight, SearchParams } from '../../types/flight';
import { generateSeatMap } from '../../services/flightApi';
import {
  formatCurrency,
  formatFlightTime,
  formatFlightFullDate,
  formatDuration,
} from '../../utils/formatters';

interface FlightDetailScreenProps {
  flight: Flight;
  searchParams: SearchParams;
  selectedSeats?: Record<string, string>;
  onBack: () => void;
  onContinue: () => void;
}

export const FlightDetailScreen: React.FC<FlightDetailScreenProps> = ({
  flight,
  searchParams,
  selectedSeats,
  onBack,
  onContinue,
}) => {
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(true);

  const totalAdults = searchParams.passengers.adults;
  const totalChildren = searchParams.passengers.children;
  const totalInfants = searchParams.passengers.infants;
  const totalPassengers = totalAdults + totalChildren + totalInfants;

  const flightUnitPrice = flight.basePrice + flight.taxes;
  const baseFarePerPassenger = Math.round(flightUnitPrice * 0.80);
  const taxesPerPassenger = Math.round(flightUnitPrice * 0.15);
  const baggagePerPassenger = flightUnitPrice - baseFarePerPassenger - taxesPerPassenger;

  const subtotalBaseFare = baseFarePerPassenger * totalPassengers;
  const subtotalTaxes = taxesPerPassenger * totalPassengers;
  const subtotalBaggage = baggagePerPassenger * totalPassengers;
  const flightSubtotal = subtotalBaseFare + subtotalTaxes + subtotalBaggage;

  const seatMap = useMemo(() => generateSeatMap(flight), [flight]);
  const seatUpgradesTotal = useMemo(() => {
    if (!selectedSeats) return 0;
    let total = 0;
    Object.values(selectedSeats).forEach((seatId) => {
      const seat = seatMap.find((s) => s.id === seatId);
      if (seat) total += seat.price;
    });
    return total;
  }, [selectedSeats, seatMap]);

  const grandTotal = flightSubtotal + seatUpgradesTotal;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Flight Details</Text>
          <Text style={styles.headerSubtitle}>
            {flight.airlineName} • Flight {flight.flightNumber}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <View style={styles.card}>
          <View style={styles.airlineHeader}>
            <View style={[styles.airlineBadge, { backgroundColor: flight.airlineLogoColor || '#0284c7' }]}>
              <Text style={styles.airlineBadgeText}>{flight.airlineCode}</Text>
            </View>
            <View style={styles.airlineInfo}>
              <Text style={styles.airlineName}>{flight.airlineName}</Text>
              <Text style={styles.aircraftText}>{flight.aircraft} • {flight.cabinClass.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.flightDate}>{formatFlightFullDate(flight.departureTime)}</Text>

          {/* Timeline details */}
          <View style={styles.timelineBlock}>
            {/* Departure */}
            <View style={styles.timelineItem}>
              <View style={styles.dotLineCol}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineVerticalLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timeBig}>{formatFlightTime(flight.departureTime)}</Text>
                <Text style={styles.airportBig}>
                  {flight.departureAirport.code} - {flight.departureAirport.name}
                </Text>
                <Text style={styles.citySmall}>{flight.departureAirport.city}, {flight.departureAirport.country}</Text>
              </View>
            </View>

            {/* Flight In-Air Duration Tag */}
            <View style={styles.durationTagRow}>
              <View style={styles.durationTag}>
                <Clock size={12} color="#0284c7" />
                <Text style={styles.durationTagText}>
                  Flight Duration: {formatDuration(flight.durationMinutes)}
                </Text>
              </View>
            </View>

            {/* Arrival */}
            <View style={styles.timelineItem}>
              <View style={styles.dotLineCol}>
                <View style={[styles.timelineDot, styles.timelineDotArrival]} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timeBig}>{formatFlightTime(flight.arrivalTime)}</Text>
                <Text style={styles.airportBig}>
                  {flight.arrivalAirport.code} - {flight.arrivalAirport.name}
                </Text>
                <Text style={styles.citySmall}>{flight.arrivalAirport.city}, {flight.arrivalAirport.country}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Onboard Amenities */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ONBOARD AMENITIES</Text>
          <View style={styles.amenitiesGrid}>
            <View style={styles.amenityItem}>
              <Wifi size={16} color="#0284c7" />
              <Text style={styles.amenityText}>High-speed Wi-Fi</Text>
            </View>
            <View style={styles.amenityItem}>
              <Zap size={16} color="#0284c7" />
              <Text style={styles.amenityText}>USB & AC Power</Text>
            </View>
            <View style={styles.amenityItem}>
              <Coffee size={16} color="#0284c7" />
              <Text style={styles.amenityText}>Complimentary Drinks</Text>
            </View>
            <View style={styles.amenityItem}>
              <Tv size={16} color="#0284c7" />
              <Text style={styles.amenityText}>Seatback Streaming</Text>
            </View>
          </View>
        </View>

        {/* Baggage Policy */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>BAGGAGE INCLUDED</Text>
          <View style={styles.baggageRow}>
            <Luggage size={18} color="#0284c7" />
            <View style={styles.baggageTextCol}>
              <Text style={styles.baggageMainText}>1 Personal Item + 1 Carry-on Bag Included</Text>
              <Text style={styles.baggageSubText}>Standard overhead bin storage up to 10kg</Text>
            </View>
          </View>
        </View>

        {/* Pricing Matrix Breakdown */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.priceHeaderRow}
            onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.sectionTitle}>FARE BREAKDOWN</Text>
              <Text style={styles.totalBigPrice}>{formatCurrency(grandTotal)}</Text>
            </View>
            {showPriceBreakdown ? (
              <ChevronUp size={20} color="#64748b" />
            ) : (
              <ChevronDown size={20} color="#64748b" />
            )}
          </TouchableOpacity>

          {showPriceBreakdown && (
            <View style={styles.breakdownTable}>
              <View style={styles.breakdownRow}>
                <Text style={styles.tableColLabel}>Base Airfare ({totalPassengers}x)</Text>
                <Text style={styles.tableColVal}>{formatCurrency(subtotalBaseFare)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.tableColLabel}>Government Taxes & Security</Text>
                <Text style={styles.tableColVal}>{formatCurrency(subtotalTaxes)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.tableColLabel}>Baggage Allowance</Text>
                <Text style={styles.tableColVal}>{formatCurrency(subtotalBaggage)}</Text>
              </View>
              {seatUpgradesTotal > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.tableColLabel}>Seat Upgrades</Text>
                  <Text style={styles.tableColVal}>{formatCurrency(seatUpgradesTotal)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>TOTAL FARE</Text>
          <Text style={styles.bottomPriceVal}>{formatCurrency(grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Select Seats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerCenter: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  airlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  airlineBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  aircraftText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  flightDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 16,
  },
  timelineBlock: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  dotLineCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0284c7',
  },
  timelineDotArrival: {
    backgroundColor: '#0f172a',
  },
  timelineVerticalLine: {
    width: 2,
    height: 48,
    backgroundColor: '#cbd5e1',
  },
  timelineTextCol: {
    marginLeft: 12,
    paddingBottom: 8,
  },
  timeBig: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  airportBig: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  citySmall: {
    fontSize: 11,
    color: '#94a3b8',
  },
  durationTagRow: {
    paddingLeft: 32,
    marginVertical: 4,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 10,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '46%',
  },
  amenityText: {
    fontSize: 12,
    color: '#334155',
  },
  baggageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  baggageTextCol: {
    flex: 1,
  },
  baggageMainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  baggageSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  totalBigPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
  },
  breakdownTable: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableColLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  tableColVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomPriceCol: {
    gap: 2,
  },
  bottomPriceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
