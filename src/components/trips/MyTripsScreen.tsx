import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  Plane,
  Calendar,
  Clock,
  Trash2,
  X,
  Search,
  Check,
  QrCode,
} from 'lucide-react-native';
import { Booking } from '../../types/flight';
import {
  formatCurrency,
  formatFlightTime,
  formatFlightDate,
  formatFlightFullDate,
  isDateInPast,
} from '../../utils/formatters';

interface MyTripsScreenProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => void;
  onStartSearch: () => void;
}

export const MyTripsScreen: React.FC<MyTripsScreenProps> = ({
  bookings,
  onCancelBooking,
  onStartSearch,
}) => {
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const upcomingBookings = safeBookings.filter((b) => {
    if (!b || b.status === 'cancelled') return false;
    const depDate = b.outboundFlight?.departureTime?.split('T')[0] || '';
    return !isDateInPast(depDate);
  });

  const pastBookings = safeBookings.filter((b) => {
    if (!b) return false;
    if (b.status === 'cancelled') return true;
    const depDate = b.outboundFlight?.departureTime?.split('T')[0] || '';
    return isDateInPast(depDate);
  });

  const displayedList =
    tab === 'all'
      ? safeBookings
      : tab === 'upcoming'
      ? upcomingBookings
      : pastBookings;
  const liveCount = upcomingBookings.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>My Trips</Text>
            <Text style={styles.headerSubtitle}>Saved bookings & digital passes</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>
              {safeBookings.length} {safeBookings.length === 1 ? 'Booking' : 'Bookings'}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
            onPress={() => setTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, tab === 'all' && styles.tabBtnTextActive]}>
              All ({safeBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setTab('upcoming')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>
              Upcoming ({upcomingBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
            onPress={() => setTab('past')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, tab === 'past' && styles.tabBtnTextActive]}>
              Cancelled ({pastBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {displayedList.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Plane size={24} color="#0284c7" />
            </View>
            <Text style={styles.emptyCardTitle}>
              {tab === 'all'
                ? 'No bookings found'
                : tab === 'upcoming'
                ? 'No upcoming trips'
                : 'No cancelled trips'}
            </Text>
            <Text style={styles.emptyCardSubtitle}>
              {tab === 'all'
                ? 'Your booked and cancelled reservations will always be visible here.'
                : tab === 'upcoming'
                ? "You don't have any confirmed flights scheduled right now."
                : 'Cancelled or past bookings are archived here.'}
            </Text>
            <TouchableOpacity style={styles.searchFlightsBtn} onPress={onStartSearch} activeOpacity={0.8}>
              <Search size={16} color="#ffffff" />
              <Text style={styles.searchFlightsBtnText}>Search Flights</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedList.map((booking) => {
            const flight = booking.outboundFlight;
            const isCancelled = booking.status === 'cancelled';

            return (
              <View
                key={booking.id}
                style={[styles.bookingCard, isCancelled && styles.bookingCardCancelled]}
              >
                {/* PNR Top Row */}
                <View style={styles.pnrRow}>
                  <View style={styles.airlineCodeRow}>
                    <View style={[styles.airlineDot, { backgroundColor: flight.airlineLogoColor || '#0284c7' }]}>
                      <Text style={styles.airlineDotText}>{flight.airlineCode}</Text>
                    </View>
                    <Text style={styles.bookingRefText}>{booking.referenceCode}</Text>
                  </View>
                  <View style={[styles.statusTag, isCancelled ? styles.statusCancelled : styles.statusConfirmed]}>
                    <Text style={[styles.statusTagText, isCancelled ? styles.statusCancelledText : styles.statusConfirmedText]}>
                      {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                    </Text>
                  </View>
                </View>

                {/* Route & Times */}
                <View style={styles.routeRow}>
                  <View>
                    <Text style={styles.routeCode}>{flight.departureAirport.code}</Text>
                    <Text style={styles.routeTime}>{formatFlightTime(flight.departureTime)}</Text>
                  </View>
                  <View style={styles.routeCenter}>
                    <Plane size={16} color="#0284c7" />
                    <Text style={styles.stopsText}>
                      {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.routeCode}>{flight.arrivalAirport.code}</Text>
                    <Text style={styles.routeTime}>{formatFlightTime(flight.arrivalTime)}</Text>
                  </View>
                </View>

                {/* Date & Fare */}
                <View style={styles.datePriceRow}>
                  <View style={styles.dateWithIcon}>
                    <Calendar size={13} color="#64748b" />
                    <Text style={styles.dateLabel}>{formatFlightDate(flight.departureTime)}</Text>
                  </View>
                  <Text style={styles.totalPrice}>{formatCurrency(booking.priceBreakdown.total)}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.boardingPassBtn}
                    onPress={() => setSelectedBookingForModal(booking)}
                    activeOpacity={0.7}
                  >
                    <QrCode size={14} color="#0284c7" />
                    <Text style={styles.boardingPassBtnText}>View Boarding Pass</Text>
                  </TouchableOpacity>

                  {isCancelled ? (
                    <View style={styles.cancelledBadgeBox}>
                      <Text style={styles.cancelledBadgeText}>Refund Issued</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setCancellingBookingId(booking.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancellingBookingId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancellingBookingId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalCard}>
            <View style={styles.cancelIconCircle}>
              <Trash2 size={24} color="#e11d48" />
            </View>
            <Text style={styles.cancelModalTitle}>Cancel this reservation?</Text>
            <Text style={styles.cancelModalSubtitle}>
              Are you sure you want to cancel booking {bookings.find((b) => b.id === cancellingBookingId)?.referenceCode}? A simulated refund will be processed to your card.
            </Text>
            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={styles.keepBookingBtn}
                onPress={() => setCancellingBookingId(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.keepBookingText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => {
                  if (cancellingBookingId) {
                    onCancelBooking(cancellingBookingId);
                    setCancellingBookingId(null);
                    setTab('all');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Boarding Pass Modal */}
      <Modal
        visible={selectedBookingForModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedBookingForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passModalCard}>
            <View style={styles.passModalHeader}>
              <View>
                <Text style={styles.passModalTitle}>Boarding Pass</Text>
                <Text style={styles.passModalCode}>
                  {selectedBookingForModal?.referenceCode}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedBookingForModal(null)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedBookingForModal && (
              <ScrollView style={styles.passModalBody}>
                <View style={styles.passRouteRow}>
                  <Text style={styles.passBigCode}>
                    {selectedBookingForModal.outboundFlight.departureAirport.code}
                  </Text>
                  <Plane size={18} color="#0284c7" />
                  <Text style={styles.passBigCode}>
                    {selectedBookingForModal.outboundFlight.arrivalAirport.code}
                  </Text>
                </View>

                <Text style={styles.passDateText}>
                  {formatFlightFullDate(selectedBookingForModal.outboundFlight.departureTime)}
                </Text>

                <View style={styles.passQrPlaceholder}>
                  <QrCode size={120} color="#0f172a" />
                  <Text style={styles.passScanText}>Scan at airport security & boarding gate</Text>
                </View>

                <View style={styles.passPassengersList}>
                  <Text style={styles.passSectionHeader}>PASSENGERS</Text>
                  {selectedBookingForModal.passengers.map((p, idx) => (
                    <View key={p.id} style={styles.passPassengerRow}>
                      <Text style={styles.passPassengerName}>
                        {idx + 1}. {p.title} {p.firstName} {p.lastName}
                      </Text>
                      <Text style={styles.passSeatTag}>
                        Seat: {selectedBookingForModal.seats[p.id] || 'General'}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 8,
  },
  searchFlightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 46,
  },
  searchFlightsBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingCard: {
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
  bookingCardCancelled: {
    opacity: 0.65,
  },
  pnrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  airlineCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airlineDot: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineDotText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingRefText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusCancelled: {
    backgroundColor: '#ffe4e6',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusConfirmedText: {
    color: '#16a34a',
  },
  statusCancelledText: {
    color: '#e11d48',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  routeCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  routeTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  routeCenter: {
    alignItems: 'center',
    gap: 2,
  },
  stopsText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  datePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  boardingPassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  boardingPassBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  cancelledBadgeBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cancelModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    maxWidth: 340,
    width: '100%',
  },
  cancelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cancelModalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  keepBookingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  keepBookingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  passModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 360,
  },
  passModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  passModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  passModalCode: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  passModalBody: {
    marginTop: 12,
  },
  passRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  passBigCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  passDateText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  passQrPlaceholder: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 8,
  },
  passScanText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  passPassengersList: {
    marginTop: 16,
    gap: 8,
  },
  passSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  passPassengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  passPassengerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  passSeatTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
});
