import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle2,
  Copy,
  Check,
  Plane,
  Calendar,
  Clock,
  QrCode,
  Home,
  Luggage,
} from 'lucide-react-native';
import { Booking } from '../../types/flight';
import {
  formatCurrency,
  formatFlightTime,
  formatFlightFullDate,
} from '../../utils/formatters';
import { getLatestValidBooking } from '../../services/storage';

interface ConfirmationScreenProps {
  booking?: Booking | null;
  onGoToTrips: () => void;
  onBookAnother: () => void;
  onRedirectToHome?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  booking: initialBooking,
  onGoToTrips,
  onBookAnother,
  onRedirectToHome,
}) => {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(initialBooking || null);
  const [isLoading, setIsLoading] = useState(!initialBooking);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeBooking) {
      getLatestValidBooking().then((stored) => {
        if (stored) {
          setActiveBooking(stored);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Retrieving confirmation...</Text>
      </View>
    );
  }

  if (!activeBooking || !activeBooking.outboundFlight) {
    return (
      <View style={styles.loadingContainer}>
        <Plane size={36} color="#94a3b8" />
        <Text style={styles.emptyTitle}>No Active Booking</Text>
        <Text style={styles.emptySubtitle}>We couldn't find a recent reservation.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onBookAnother} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Book a Flight</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const flight = activeBooking.outboundFlight;

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Success Banner */}
      <View style={styles.successBanner}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={36} color="#16a34a" />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your electronic ticket and confirmation have been issued.
        </Text>
      </View>

      {/* Boarding Pass Ticket Card */}
      <View style={styles.ticketCard}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View>
            <Text style={styles.pnrLabel}>BOOKING REFERENCE</Text>
            <TouchableOpacity style={styles.pnrRow} onPress={handleCopyCode} activeOpacity={0.7}>
              <Text style={styles.pnrCode}>{activeBooking.referenceCode}</Text>
              {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#64748b" />}
            </TouchableOpacity>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>CONFIRMED</Text>
          </View>
        </View>

        {/* Route Row */}
        <View style={styles.routeRow}>
          <View>
            <Text style={styles.airportCodeText}>{flight.departureAirport.code}</Text>
            <Text style={styles.cityText}>{flight.departureAirport.city}</Text>
            <Text style={styles.timeText}>{formatFlightTime(flight.departureTime)}</Text>
          </View>

          <View style={styles.flightCenterCol}>
            <Plane size={18} color="#0284c7" />
            <Text style={styles.flightNumText}>{flight.airlineName} • {flight.flightNumber}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.airportCodeText}>{flight.arrivalAirport.code}</Text>
            <Text style={styles.cityText}>{flight.arrivalAirport.city}</Text>
            <Text style={styles.timeText}>{formatFlightTime(flight.arrivalTime)}</Text>
          </View>
        </View>

        {/* Date Row */}
        <View style={styles.dateRow}>
          <Calendar size={14} color="#64748b" />
          <Text style={styles.dateText}>{formatFlightFullDate(flight.departureTime)}</Text>
        </View>

        {/* Perforated Divider */}
        <View style={styles.divider} />

        {/* Travelers & Seat Assignments */}
        <View style={styles.passengerSection}>
          <Text style={styles.sectionHeaderTitle}>TRAVELERS & SEATS</Text>
          {activeBooking.passengers.map((p, idx) => {
            const seat = activeBooking.seats[p.id];
            return (
              <View key={p.id} style={styles.passengerRow}>
                <Text style={styles.passengerName}>
                  {idx + 1}. {p.title} {p.firstName} {p.lastName}
                </Text>
                <View style={styles.seatPill}>
                  <Text style={styles.seatPillText}>{seat ? `Seat ${seat}` : 'General Cabin'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentLabel}>Amount Paid (Simulated)</Text>
          <Text style={styles.paymentAmount}>{formatCurrency(activeBooking.priceBreakdown.total)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoToTrips} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>View in My Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onBookAnother} activeOpacity={0.7}>
          <Home size={16} color="#0f172a" />
          <Text style={styles.secondaryBtnText}>Book Another Flight</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pnrLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#94a3b8',
  },
  pnrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    minHeight: 36,
  },
  pnrCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  airportCodeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cityText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 4,
  },
  flightCenterCol: {
    alignItems: 'center',
    gap: 4,
  },
  flightNumText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 14,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  passengerSection: {
    gap: 8,
    paddingVertical: 8,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  passengerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  seatPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seatPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 6,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 10,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minHeight: 50,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
