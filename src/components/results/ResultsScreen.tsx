import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  SlidersHorizontal,
  Clock,
  Plane,
  RotateCcw,
  Check,
  X,
  Search,
} from 'lucide-react-native';
import {
  Flight,
  SearchParams,
  SortOption,
} from '../../types/flight';
import {
  formatCurrency,
  formatFlightTime,
  formatDuration,
  formatFlightDate,
} from '../../utils/formatters';
import { AIRLINES } from '../../data/mockFlights';

interface ResultsScreenProps {
  searchParams: SearchParams;
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectFlight: (flight: Flight) => void;
  onBack: () => void;
  onEditSearch: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  searchParams,
  flights,
  isLoading,
  error,
  onRetry,
  onSelectFlight,
  onBack,
  onEditSearch,
}) => {
  const [uiState, setUiState] = useState<'loading' | 'success' | 'empty' | 'error'>('loading');
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStops, setFilterStops] = useState<'all' | '0' | '1'>('all');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      setUiState('loading');
      return;
    }
    if (error) {
      setUiState('error');
      return;
    }
    if (!flights || flights.length === 0) {
      setUiState('empty');
      return;
    }
    setUiState('success');
  }, [flights, error, isLoading]);

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      if (filterStops === '0' && flight.stops !== 0) return false;
      if (filterStops === '1' && flight.stops !== 1) return false;
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.airlineCode)) {
        return false;
      }
      return true;
    });
  }, [flights, filterStops, selectedAirlines]);

  const sortedAndFilteredFlights = useMemo(() => {
    const list = [...filteredFlights];
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.basePrice + a.taxes - (b.basePrice + b.taxes));
      case 'duration_asc':
        return list.sort((a, b) => a.durationMinutes - b.durationMinutes);
      case 'departure_asc':
        return list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      default:
        return list;
    }
  }, [filteredFlights, sortBy]);

  const renderFlightItem = ({ item }: { item: Flight }) => {
    const totalPrice = item.basePrice + item.taxes;

    return (
      <TouchableOpacity
        style={styles.flightCard}
        onPress={() => onSelectFlight(item)}
        activeOpacity={0.7}
      >
        {/* Card Header: Airline Info & Tags */}
        <View style={styles.cardHeader}>
          <View style={styles.airlineBadgeRow}>
            <View style={[styles.airlineLogo, { backgroundColor: item.airlineLogoColor || '#0284c7' }]}>
              <Text style={styles.airlineLogoText}>{item.airlineCode}</Text>
            </View>
            <View>
              <Text style={styles.airlineName}>{item.airlineName}</Text>
              <Text style={styles.flightNumber}>{item.flightNumber} • {item.aircraft}</Text>
            </View>
          </View>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>
              {item.cabinClass.charAt(0).toUpperCase() + item.cabinClass.slice(1)}
            </Text>
          </View>
        </View>

        {/* Flight Times & Duration Timeline */}
        <View style={styles.timelineRow}>
          {/* Departure */}
          <View style={styles.endpointCol}>
            <Text style={styles.timeText}>{formatFlightTime(item.departureTime)}</Text>
            <Text style={styles.airportCodeText}>{item.departureAirport.code}</Text>
            <Text style={styles.cityText} numberOfLines={1}>{item.departureAirport.city}</Text>
          </View>

          {/* Flight Path Graphic */}
          <View style={styles.flightPathCol}>
            <Text style={styles.durationText}>{formatDuration(item.durationMinutes)}</Text>
            <View style={styles.flightLineContainer}>
              <View style={styles.flightDot} />
              <View style={styles.flightDashLine} />
              <Plane size={14} color="#0284c7" />
              <View style={styles.flightDashLine} />
              <View style={styles.flightDot} />
            </View>
            <Text style={styles.stopsText}>
              {item.stops === 0 ? 'Non-stop' : `${item.stops} stop (${item.layovers?.map((l) => l.airport.code).join(', ') || '1 Stop'})`}
            </Text>
          </View>

          {/* Arrival */}
          <View style={[styles.endpointCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.timeText}>{formatFlightTime(item.arrivalTime)}</Text>
            <Text style={styles.airportCodeText}>{item.arrivalAirport.code}</Text>
            <Text style={styles.cityText} numberOfLines={1}>{item.arrivalAirport.city}</Text>
          </View>
        </View>

        {/* Card Footer: Pricing and Select Button */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>TOTAL PER TRAVELER</Text>
            <Text style={styles.totalPriceText}>{formatCurrency(totalPrice)}</Text>
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => onSelectFlight(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.routeTitle}>
            {searchParams.origin?.code} → {searchParams.destination?.code}
          </Text>
          <Text style={styles.routeSubtitle}>
            {formatFlightDate(searchParams.departureDate)} • {searchParams.passengers.adults + searchParams.passengers.children + searchParams.passengers.infants} Traveler(s)
          </Text>
        </View>

        <TouchableOpacity style={styles.editSearchButton} onPress={onEditSearch} activeOpacity={0.7}>
          <Text style={styles.editSearchText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters / Sorting Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={14} color="#2563eb" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'price_asc' && styles.sortChipActive]}
          onPress={() => setSortBy('price_asc')}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortChipText, sortBy === 'price_asc' && styles.sortChipTextActive]}>
            Cheapest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'duration_asc' && styles.sortChipActive]}
          onPress={() => setSortBy('duration_asc')}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortChipText, sortBy === 'duration_asc' && styles.sortChipTextActive]}>
            Fastest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortChip, filterStops === '0' && styles.sortChipActive]}
          onPress={() => setFilterStops((s) => (s === '0' ? 'all' : '0'))}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortChipText, filterStops === '0' && styles.sortChipTextActive]}>
            Non-stop
          </Text>
        </TouchableOpacity>
      </View>

      {/* UI State Views */}
      {uiState === 'loading' && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={[styles.flightCard, { opacity: 0.85, paddingVertical: 18 }]}>
              <View style={[styles.cardHeader, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e2e8f0' }} />
                  <View>
                    <View style={{ width: 120, height: 14, borderRadius: 6, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
                    <View style={{ width: 80, height: 10, borderRadius: 4, backgroundColor: '#f1f5f9' }} />
                  </View>
                </View>
                <View style={{ width: 70, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0' }} />
              </View>
              <View style={[styles.timelineRow, { marginVertical: 12 }]}>
                <View style={{ width: 60, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9' }} />
                <View style={{ flex: 1, marginHorizontal: 16, height: 2, backgroundColor: '#e2e8f0' }} />
                <View style={{ width: 60, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9' }} />
              </View>
              <View style={[styles.cardFooter, { paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                <View style={{ width: 90, height: 20, borderRadius: 6, backgroundColor: '#e2e8f0' }} />
                <View style={{ width: 110, height: 36, borderRadius: 10, backgroundColor: '#bfdbfe' }} />
              </View>
            </View>
          ))}
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={[styles.stateSubtitle, { marginTop: 6 }]}>Searching live airline inventories...</Text>
          </View>
        </View>
      )}

      {uiState === 'error' && (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Unable to Load Flights</Text>
          <Text style={styles.stateSubtitle}>{error || 'Network error encountered. Please try again.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <RotateCcw size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {uiState === 'empty' && (
        <View style={styles.stateContainer}>
          <Search size={32} color="#94a3b8" />
          <Text style={styles.stateTitle}>No Flights Found</Text>
          <Text style={styles.stateSubtitle}>Try adjusting your travel dates or airport filters.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onEditSearch} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Adjust Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Virtualized Flight List Migration */}
      {uiState === 'success' && (
        <FlatList
          data={sortedAndFilteredFlights}
          keyExtractor={(item) => item.id}
          renderItem={renderFlightItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Flights</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>STOPS</Text>
            <View style={styles.filterRow}>
              {[
                { id: 'all', label: 'All Flights' },
                { id: '0', label: 'Non-stop Only' },
                { id: '1', label: '1 Stop' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.filterChoice, filterStops === opt.id && styles.filterChoiceActive]}
                  onPress={() => setFilterStops(opt.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChoiceText, filterStops === opt.id && styles.filterChoiceTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>AIRLINES</Text>
            <View style={styles.airlinesFilterList}>
              {AIRLINES.map((airline) => {
                const isSelected = selectedAirlines.includes(airline.code);
                return (
                  <TouchableOpacity
                    key={airline.code}
                    style={styles.airlineCheckboxRow}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedAirlines((prev) => prev.filter((c) => c !== airline.code));
                      } else {
                        setSelectedAirlines((prev) => [...prev, airline.code]);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Check size={14} color="#ffffff" />}
                    </View>
                    <Text style={styles.airlineCheckboxLabel}>{airline.name} ({airline.code})</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilters(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyFilterText}>Apply Filters ({filteredFlights.length} Flights)</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    marginHorizontal: 12,
  },
  routeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  routeSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  editSearchButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    minHeight: 38,
    justifyContent: 'center',
  },
  editSearchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    minHeight: 38,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    minHeight: 38,
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: '#2563eb',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sortChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  airlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  airlineLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineLogoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  flightNumber: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  endpointCol: {
    minWidth: 80,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  airportCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  cityText: {
    fontSize: 11,
    color: '#94a3b8',
    maxWidth: 90,
  },
  flightPathCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  flightLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  flightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
  },
  flightDashLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  stopsText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '500',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  totalPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 1,
  },
  selectButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  stateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    minHeight: 44,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChoice: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  filterChoiceActive: {
    backgroundColor: '#0284c7',
  },
  filterChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChoiceTextActive: {
    color: '#ffffff',
  },
  airlinesFilterList: {
    gap: 10,
  },
  airlineCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  airlineCheckboxLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  applyFilterBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  applyFilterText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
