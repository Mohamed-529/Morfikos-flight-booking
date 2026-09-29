import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  ChevronDown,
  X,
  Check,
} from 'lucide-react-native';
import {
  PassengerInfo,
  PassengerValidationErrors,
  SearchParams,
} from '../../types/flight';
import { getTodayDateString } from '../../utils/formatters';

interface PassengerFormScreenProps {
  searchParams: SearchParams;
  initialPassengers: PassengerInfo[];
  onSubmit: (passengers: PassengerInfo[]) => void;
  onBack: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const PassengerFormScreen: React.FC<PassengerFormScreenProps> = ({
  initialPassengers,
  onSubmit,
  onBack,
}) => {
  const [passengers, setPassengers] = useState<PassengerInfo[]>(initialPassengers);
  const [errors, setErrors] = useState<Record<string, PassengerValidationErrors>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Active Picker Modal for Date of Birth
  const [activeDobModal, setActiveDobModal] = useState<{
    passengerIndex: number;
    part: 'day' | 'month' | 'year';
  } | null>(null);

  // Helper to parse any DOB format into { day, month, year }
  const parseDobParts = (dobString?: string) => {
    if (!dobString) return { day: '', month: '', year: '' };
    const parts = dobString.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return {
          day: String(d).padStart(2, '0'),
          month: MONTH_NAMES[m - 1] || 'Jan',
          year: y,
        };
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parts[2];
        return {
          day: String(d).padStart(2, '0'),
          month: MONTH_NAMES[m - 1] || 'Jan',
          year: y,
        };
      }
    }
    return { day: '15', month: 'Aug', year: '1995' };
  };

  const validateField = (passenger: PassengerInfo, field: keyof PassengerInfo): string | undefined => {
    if (field === 'firstName') {
      const trimmed = passenger.firstName?.trim() || '';
      if (!trimmed) return 'First name is required';
      if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'First name must contain alphabets only';
      if (trimmed.length < 2) return 'First name must be at least 2 letters';
    }
    if (field === 'lastName') {
      const trimmed = passenger.lastName?.trim() || '';
      if (trimmed && !/^[A-Za-z\s]+$/.test(trimmed)) return 'Last name must contain alphabets only';
      return undefined;
    }
    if (field === 'dateOfBirth') {
      if (!passenger.dateOfBirth) return 'Date of birth is required';

      // Parse birth date safely
      const parts = passenger.dateOfBirth.split(/[-/]/);
      let birthYear = 0;
      let birthMonth = 0;
      let birthDay = 0;

      if (parts.length === 3) {
        if (parts[0].length === 4) {
          birthYear = parseInt(parts[0], 10);
          birthMonth = parseInt(parts[1], 10);
          birthDay = parseInt(parts[2], 10);
        } else if (parts[2].length === 4) {
          birthDay = parseInt(parts[0], 10);
          birthMonth = parseInt(parts[1], 10);
          birthYear = parseInt(parts[2], 10);
        }
      }

      if (!birthYear || !birthMonth || !birthDay || isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
        return 'Please enter a valid date of birth';
      }

      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      const now = new Date();

      if (birthDate > now) {
        return 'Date of birth cannot be in the future';
      }

      let age = now.getFullYear() - birthYear;
      const m = now.getMonth() - (birthMonth - 1);
      if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
        age--;
      }

      if (passenger.type === 'adult' && age < 12) {
        return 'Adult passenger must be at least 12 years old';
      }
      if (passenger.type === 'child' && (age < 2 || age >= 12)) {
        return 'Child passenger must be between 2 and 11 years old';
      }
      if (passenger.type === 'infant' && age >= 2) {
        return 'Infant passenger must be under 2 years old';
      }
    }
    if (field === 'email' && passenger.id === passengers[0]?.id) {
      if (!passenger.email?.trim()) return 'Contact email is required for booking';
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(passenger.email.trim())) return 'Please enter a valid email address';
    }
    if (field === 'phone' && passenger.id === passengers[0]?.id) {
      const digits = (passenger.phone || '').replace(/\D/g, '');
      if (!digits) return '10-digit mobile phone number is required';
      if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
    }
    return undefined;
  };

  const handleFieldChange = (
    index: number,
    field: keyof PassengerInfo,
    value: string
  ) => {
    let sanitized = value;
    if (field === 'firstName' || field === 'lastName') {
      // Instantly reject any non-alphabet character without accepting/erasing
      if (/[^A-Za-z\s]/.test(value)) {
        return;
      }
      // Do not allow starting with spaces
      if (value.startsWith(' ')) {
        return;
      }
      sanitized = value;
    } else if (field === 'phone') {
      sanitized = value.replace(/\D/g, '').slice(0, 10);
    }

    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: sanitized };
    setPassengers(updated);

    const targetPassenger = updated[index];
    const fieldError = validateField(targetPassenger, field);
    setErrors((prev) => ({
      ...prev,
      [targetPassenger.id]: {
        ...prev[targetPassenger.id],
        [field]: fieldError,
      },
    }));
  };

  const handleUpdateDobPart = (index: number, part: 'day' | 'month' | 'year', selectedVal: string) => {
    const p = passengers[index];
    const current = parseDobParts(p.dateOfBirth);

    let d = current.day || '01';
    let m = current.month || 'Jan';
    let y = current.year || '1995';

    if (part === 'day') d = selectedVal;
    if (part === 'month') m = selectedVal;
    if (part === 'year') y = selectedVal;

    const monthNum = String(MONTH_NAMES.indexOf(m) + 1).padStart(2, '0');
    // Store standard ISO format YYYY-MM-DD
    const newDob = `${y}-${monthNum}-${d}`;

    const updated = [...passengers];
    updated[index] = { ...updated[index], dateOfBirth: newDob };
    setPassengers(updated);

    const err = validateField(updated[index], 'dateOfBirth');
    setErrors((prev) => ({
      ...prev,
      [p.id]: {
        ...prev[p.id],
        dateOfBirth: err,
      },
    }));
    setActiveDobModal(null);
  };

  const handleBlur = (index: number, field: keyof PassengerInfo) => {
    const p = passengers[index];
    setTouched((prev) => ({ ...prev, [`${p.id}_${field}`]: true }));
    const err = validateField(p, field);
    setErrors((prev) => ({
      ...prev,
      [p.id]: {
        ...prev[p.id],
        [field]: err,
      },
    }));
  };

  const validateAll = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, PassengerValidationErrors> = {};
    const newTouched: Record<string, boolean> = {};

    passengers.forEach((p) => {
      const pErrors: PassengerValidationErrors = {};
      const fieldsToCheck: (keyof PassengerValidationErrors)[] = ['firstName', 'dateOfBirth'];
      if (p.lastName && p.lastName.trim()) {
        fieldsToCheck.push('lastName');
      }
      if (p.id === passengers[0]?.id) {
        fieldsToCheck.push('email', 'phone');
      }

      fieldsToCheck.forEach((f) => {
        newTouched[`${p.id}_${f}`] = true;
        const err = validateField(p, f);
        if (err) {
          pErrors[f] = err;
          isValid = false;
        }
      });

      newErrors[p.id] = pErrors;
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateAll()) return;
    onSubmit(passengers);
  };

  // Generate lists for Day, Month, Year pickers
  const daysList = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 90 }, (_, i) => String(currentYear - i));

  return (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Passenger Details</Text>
            <Text style={styles.headerSubtitle}>
              {passengers.length} traveler{passengers.length > 1 ? 's' : ''} info
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {passengers.map((passenger, index) => {
            const isLead = index === 0;
            const pErrors = errors[passenger.id] || {};
            const dob = parseDobParts(passenger.dateOfBirth);

            return (
              <View key={passenger.id} style={styles.passengerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <View style={styles.passengerNumberBadge}>
                      <Text style={styles.passengerNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.passengerCardTitle}>
                      {passenger.type.toUpperCase()} PASSENGER
                    </Text>
                  </View>
                  {isLead && (
                    <View style={styles.leadBadge}>
                      <Text style={styles.leadBadgeText}>Primary Contact</Text>
                    </View>
                  )}
                </View>

                {/* Title Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TITLE</Text>
                  <View style={styles.titleRow}>
                    {(['Mr', 'Ms', 'Mrs'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.titleBtn, passenger.title === t && styles.titleBtnActive]}
                        onPress={() => handleFieldChange(index, 'title', t)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.titleBtnText, passenger.title === t && styles.titleBtnTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* First Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FIRST NAME (LETTERS ONLY)</Text>
                  <View style={[styles.inputContainer, touched[`${passenger.id}_firstName`] && pErrors.firstName && styles.inputError]}>
                    <User size={16} color="#64748b" />
                    <TextInput
                      style={styles.textInput}
                      value={passenger.firstName}
                      onChangeText={(val) => handleFieldChange(index, 'firstName', val)}
                      onBlur={() => handleBlur(index, 'firstName')}
                      placeholder="e.g. Mohamed"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="words"
                    />
                  </View>
                  {touched[`${passenger.id}_firstName`] && pErrors.firstName && (
                    <Text style={styles.errorText}>{pErrors.firstName}</Text>
                  )}
                </View>

                {/* Last Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>LAST NAME (OPTIONAL)</Text>
                  <View style={[styles.inputContainer, touched[`${passenger.id}_lastName`] && pErrors.lastName && styles.inputError]}>
                    <User size={16} color="#64748b" />
                    <TextInput
                      style={styles.textInput}
                      value={passenger.lastName}
                      onChangeText={(val) => handleFieldChange(index, 'lastName', val)}
                      onBlur={() => handleBlur(index, 'lastName')}
                      placeholder="e.g. Yusuff (optional)"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="words"
                    />
                  </View>
                  {touched[`${passenger.id}_lastName`] && pErrors.lastName && (
                    <Text style={styles.errorText}>{pErrors.lastName}</Text>
                  )}
                </View>

                {/* Date of Birth: 3 Selectable Dropdowns (Day, Month, Year) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>DATE OF BIRTH (DAY / MONTH / YEAR)</Text>
                  <View style={styles.dobSelectorRow}>
                    {/* Day Selector */}
                    <TouchableOpacity
                      style={styles.dobSelectBtn}
                      onPress={() => setActiveDobModal({ passengerIndex: index, part: 'day' })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dobSelectLabel}>Day</Text>
                      <View style={styles.dobSelectInner}>
                        <Text style={styles.dobSelectValue}>{dob.day || '15'}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </View>
                    </TouchableOpacity>

                    {/* Month Selector */}
                    <TouchableOpacity
                      style={styles.dobSelectBtn}
                      onPress={() => setActiveDobModal({ passengerIndex: index, part: 'month' })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dobSelectLabel}>Month</Text>
                      <View style={styles.dobSelectInner}>
                        <Text style={styles.dobSelectValue}>{dob.month || 'Aug'}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </View>
                    </TouchableOpacity>

                    {/* Year Selector */}
                    <TouchableOpacity
                      style={styles.dobSelectBtn}
                      onPress={() => setActiveDobModal({ passengerIndex: index, part: 'year' })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dobSelectLabel}>Year</Text>
                      <View style={styles.dobSelectInner}>
                        <Text style={styles.dobSelectValue}>{dob.year || '1995'}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {pErrors.dateOfBirth && (
                    <Text style={styles.errorText}>{pErrors.dateOfBirth}</Text>
                  )}
                </View>

                {/* Primary Contact Details */}
                {isLead && (
                  <View style={styles.contactSection}>
                    <Text style={styles.contactHeaderTitle}>CONTACT INFORMATION</Text>

                    {/* Email */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                      <View style={[styles.inputContainer, touched[`${passenger.id}_email`] && pErrors.email && styles.inputError]}>
                        <Mail size={16} color="#64748b" />
                        <TextInput
                          style={styles.textInput}
                          value={passenger.email}
                          onChangeText={(val) => handleFieldChange(index, 'email', val)}
                          onBlur={() => handleBlur(index, 'email')}
                          placeholder="name@domain.com"
                          placeholderTextColor="#94a3b8"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {touched[`${passenger.id}_email`] && pErrors.email && (
                        <Text style={styles.errorText}>{pErrors.email}</Text>
                      )}
                    </View>

                    {/* Mobile Phone */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>MOBILE PHONE (10 DIGITS)</Text>
                      <View style={[styles.inputContainer, touched[`${passenger.id}_phone`] && pErrors.phone && styles.inputError]}>
                        <View style={styles.flagBadge}>
                          <Text style={styles.flagText}>+91</Text>
                        </View>
                        <TextInput
                          style={styles.textInput}
                          value={passenger.phone}
                          onChangeText={(val) => handleFieldChange(index, 'phone', val)}
                          onBlur={() => handleBlur(index, 'phone')}
                          placeholder="9876543210"
                          placeholderTextColor="#94a3b8"
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                      {touched[`${passenger.id}_phone`] && pErrors.phone && (
                        <Text style={styles.errorText}>{pErrors.phone}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal for Day, Month, or Year */}
        <Modal
          visible={activeDobModal !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setActiveDobModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  Select Date of Birth {activeDobModal?.part.toUpperCase()}
                </Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setActiveDobModal(null)}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                {activeDobModal?.part === 'day' &&
                  daysList.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.pickerItem}
                      onPress={() => handleUpdateDobPart(activeDobModal.passengerIndex, 'day', d)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerItemText}>{d}</Text>
                    </TouchableOpacity>
                  ))}

                {activeDobModal?.part === 'month' &&
                  MONTH_NAMES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={styles.pickerItem}
                      onPress={() => handleUpdateDobPart(activeDobModal.passengerIndex, 'month', m)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerItemText}>{m}</Text>
                    </TouchableOpacity>
                  ))}

                {activeDobModal?.part === 'year' &&
                  yearsList.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={styles.pickerItem}
                      onPress={() => handleUpdateDobPart(activeDobModal.passengerIndex, 'year', y)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerItemText}>{y}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
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
    paddingBottom: 32,
  },
  passengerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  passengerCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  leadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  leadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#64748b',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  titleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  titleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  titleBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  dobSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dobSelectBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dobSelectLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dobSelectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dobSelectValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactSection: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  contactHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  flagBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerScroll: {
    maxHeight: 280,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
});
