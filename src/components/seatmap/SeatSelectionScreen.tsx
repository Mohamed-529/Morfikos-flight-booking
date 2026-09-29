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
  Check,
  Info,
} from 'lucide-react-native';
import { Flight, PassengerInfo, Seat } from '../../types/flight';
import { generateSeatMap } from '../../services/flightApi';
import { formatCurrency } from '../../utils/formatters';

interface SeatSelectionScreenProps {
  flight: Flight;
  passengers: PassengerInfo[];
  selectedSeats: Record<string, string>;
  onSaveSeats: (seats: Record<string, string>) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const SeatSelectionScreen: React.FC<SeatSelectionScreenProps> = ({
  flight,
  passengers,
  selectedSeats: initialSelectedSeats,
  onSaveSeats,
  onBack,
  onSkip,
}) => {
  const allSeats = useMemo(() => generateSeatMap(flight), [flight]);
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);
  const [assignedSeats, setAssignedSeats] = useState<Record<string, string>>(initialSelectedSeats);

  const activePassenger = passengers[activePassengerIndex] || passengers[0];

  const rows = useMemo(() => {
    const rowMap = new Map<number, Seat[]>();
    allSeats.forEach((seat) => {
      const list = rowMap.get(seat.row) || [];
      list.push(seat);
      rowMap.set(seat.row, list);
    });
    return Array.from(rowMap.entries()).sort(([a], [b]) => a - b);
  }, [allSeats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;

    const existingPassengerForSeat = Object.entries(assignedSeats).find(
      ([pId, sId]) => sId === seat.id && pId !== activePassenger.id
    );

    if (existingPassengerForSeat) {
      return;
    }

    const currentSeatForActive = assignedSeats[activePassenger.id];

    if (currentSeatForActive === seat.id) {
      const next = { ...assignedSeats };
      delete next[activePassenger.id];
      setAssignedSeats(next);
    } else {
      const next = {
        ...assignedSeats,
        [activePassenger.id]: seat.id,
      };
      setAssignedSeats(next);

      if (activePassengerIndex < passengers.length - 1) {
        setActivePassengerIndex((prev) => prev + 1);
      }
    }
  };

  const totalSeatFees = useMemo(() => {
    let sum = 0;
    Object.values(assignedSeats).forEach((seatId) => {
      const seat = allSeats.find((s) => s.id === seatId);
      if (seat) sum += seat.price;
    });
    return sum;
  }, [assignedSeats, allSeats]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select Seats</Text>
          <Text style={styles.headerSubtitle}>
            {flight.airlineName} • {flight.aircraft}
          </Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Passenger Switcher Bar */}
      <View style={styles.passengerBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.passengerScroll}>
          {passengers.map((p, idx) => {
            const isSelected = idx === activePassengerIndex;
            const assigned = assignedSeats[p.id];
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.passengerChip, isSelected && styles.passengerChipActive]}
                onPress={() => setActivePassengerIndex(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.passengerChipName, isSelected && styles.passengerChipTextActive]}>
                  {p.firstName ? `${p.firstName} ${p.lastName}` : `Passenger ${idx + 1}`}
                </Text>
                <View style={[styles.seatTag, isSelected && styles.seatTagActive]}>
                  <Text style={[styles.seatTagText, isSelected && styles.seatTagTextActive]}>
                    {assigned ? `Seat ${assigned}` : 'Unassigned'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Seat Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendOccupied]} />
          <Text style={styles.legendText}>Occupied</Text>
        </View>
      </View>

      {/* Fuselage Seat Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.fuselageContainer}>
        <View style={styles.fuselage}>
          {/* Nose of plane */}
          <View style={styles.planeNose}>
            <Text style={styles.cockpitText}>FRONT OF AIRCRAFT</Text>
          </View>

          {/* Seat Rows */}
          {rows.map(([rowNum, seatList]) => {
            const leftSeats = seatList.filter((s) => ['A', 'B', 'C'].includes(s.col));
            const rightSeats = seatList.filter((s) => ['D', 'E', 'F'].includes(s.col));

            return (
              <View key={rowNum} style={styles.seatRow}>
                {/* Left side seats (A, B, C) */}
                <View style={styles.seatGroup}>
                  {leftSeats.map((seat) => {
                    const isOccupied = seat.status === 'occupied';
                    const isSelected = Object.values(assignedSeats).includes(seat.id);
                    const isSelectedByActive = assignedSeats[activePassenger.id] === seat.id;

                    return (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.seatBtn,
                          isOccupied && styles.seatOccupied,
                          isSelected && styles.seatSelected,
                          isSelectedByActive && styles.seatSelectedActive,
                        ]}
                        disabled={isOccupied}
                        onPress={() => handleSeatClick(seat)}
                        activeOpacity={0.7}
                      >
                        {isSelected ? (
                          <Check size={12} color="#ffffff" />
                        ) : (
                          <Text style={[styles.seatColText, isOccupied && styles.seatColTextOccupied]}>
                            {seat.col}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Aisle */}
                <View style={styles.aisleCol}>
                  <Text style={styles.rowNumberText}>{rowNum}</Text>
                </View>

                {/* Right side seats (D, E, F) */}
                <View style={styles.seatGroup}>
                  {rightSeats.map((seat) => {
                    const isOccupied = seat.status === 'occupied';
                    const isSelected = Object.values(assignedSeats).includes(seat.id);
                    const isSelectedByActive = assignedSeats[activePassenger.id] === seat.id;

                    return (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.seatBtn,
                          isOccupied && styles.seatOccupied,
                          isSelected && styles.seatSelected,
                          isSelectedByActive && styles.seatSelectedActive,
                        ]}
                        disabled={isOccupied}
                        onPress={() => handleSeatClick(seat)}
                        activeOpacity={0.7}
                      >
                        {isSelected ? (
                          <Check size={12} color="#ffffff" />
                        ) : (
                          <Text style={[styles.seatColText, isOccupied && styles.seatColTextOccupied]}>
                            {seat.col}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomFeeLabel}>SEAT FEES</Text>
          <Text style={styles.bottomFeeValue}>
            {totalSeatFees > 0 ? formatCurrency(totalSeatFees) : 'Included'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onSaveSeats(assignedSeats)}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>Confirm Seats</Text>
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
    flex: 1,
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
  skipButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  passengerBar: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  passengerScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  passengerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 44,
    justifyContent: 'center',
  },
  passengerChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  passengerChipName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  passengerChipTextActive: {
    color: '#0284c7',
  },
  seatTag: {
    marginTop: 2,
  },
  seatTagActive: {},
  seatTagText: {
    fontSize: 10,
    color: '#64748b',
  },
  seatTagTextActive: {
    color: '#0284c7',
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendAvailable: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  legendSelected: {
    backgroundColor: '#0284c7',
  },
  legendOccupied: {
    backgroundColor: '#cbd5e1',
  },
  legendText: {
    fontSize: 11,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  fuselageContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 32,
  },
  fuselage: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: 320,
  },
  planeNose: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  cockpitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  aisleCol: {
    width: 36,
    alignItems: 'center',
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  seatBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatOccupied: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  seatSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  seatSelectedActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  seatColText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  seatColTextOccupied: {
    color: '#94a3b8',
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
  bottomInfo: {
    gap: 2,
  },
  bottomFeeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  bottomFeeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
