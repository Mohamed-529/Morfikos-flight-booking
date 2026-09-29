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
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { Flight, PassengerInfo, PriceBreakdown } from '../../types/flight';
import { formatCurrency, formatFlightTime, formatFlightDate } from '../../utils/formatters';
import { processPaymentApi } from '../../services/flightApi';

interface PaymentScreenProps {
  flight: Flight;
  passengers: PassengerInfo[];
  priceBreakdown: PriceBreakdown;
  selectedSeats: Record<string, string>;
  onPaymentSuccess: (paymentSummary: { brand: string; last4: string }) => void;
  onBack: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  flight,
  passengers,
  priceBreakdown,
  selectedSeats,
  onPaymentSuccess,
  onBack,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(
    passengers[0]?.firstName
      ? `${passengers[0].firstName} ${passengers[0].lastName}`.toUpperCase()
      : ''
  );
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const detectBrand = (num: string): 'visa' | 'mastercard' | 'amex' | 'generic' => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    return 'generic';
  };

  const cardBrand = detectBrand(cardNumber);

  const validateCardNumber = (val: string): string | undefined => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return 'Card number is required';
    if (cardBrand === 'amex') {
      if (clean.length !== 15) return 'American Express requires a 15-digit number';
    } else {
      if (clean.length !== 16) return 'Please enter a complete 16-digit card number';
    }
    return undefined;
  };

  const validateCardHolder = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Name on card is required';
    if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'Name must contain letters only';
    if (trimmed.length < 2) return 'Name must be at least 2 letters';
    return undefined;
  };

  const validateExpiry = (val: string): string | undefined => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return 'Expiry date is required';
    if (digits.length < 4) return 'Enter full expiry MM/YY';

    const month = parseInt(digits.slice(0, 2), 10);
    const year = parseInt(digits.slice(2, 4), 10);

    if (month < 1 || month > 12) {
      return 'Expiry month must be between 01 and 12';
    }

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Card has expired. Enter a valid future date';
    }

    if (year > currentYear + 25) {
      return 'Expiry year is too far in the future';
    }

    return undefined;
  };

  const validateCvv = (val: string, brand: string): string | undefined => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return 'Security code (CVV) is required';
    if (brand === 'amex') {
      if (clean.length !== 4) return 'Amex CVV must be 4 digits';
    } else {
      if (clean.length !== 3) return 'CVV must be 3 digits';
    }
    return undefined;
  };

  const cardNumberError = touched.cardNumber ? validateCardNumber(cardNumber) : undefined;
  const cardHolderError = touched.cardHolder ? validateCardHolder(cardHolder) : undefined;
  const expiryError = touched.expiry ? validateExpiry(expiry) : undefined;
  const cvvError = touched.cvv ? validateCvv(cvv, cardBrand) : undefined;

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
    setPaymentError(null);
    setTouched((prev) => ({ ...prev, cardNumber: true }));
  };

  const handleCardHolderChange = (val: string) => {
    const lettersOnly = val.replace(/[^A-Za-z\s]/g, '').toUpperCase();
    setCardHolder(lettersOnly);
    setPaymentError(null);
    setTouched((prev) => ({ ...prev, cardHolder: true }));
  };

  const handleExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length === 1 && parseInt(clean, 10) > 1) {
      clean = `0${clean}`;
    }
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setExpiry(formatted);
    setPaymentError(null);
    setTouched((prev) => ({ ...prev, expiry: true }));
  };

  const handleCvvChange = (val: string) => {
    const maxLen = cardBrand === 'amex' ? 4 : 3;
    const clean = val.replace(/\D/g, '').slice(0, maxLen);
    setCvv(clean);
    setPaymentError(null);
    setTouched((prev) => ({ ...prev, cvv: true }));
  };

  const handlePay = async () => {
    setTouched({
      cardNumber: true,
      cardHolder: true,
      expiry: true,
      cvv: true,
    });

    const cErr = validateCardNumber(cardNumber);
    const nErr = validateCardHolder(cardHolder);
    const eErr = validateExpiry(expiry);
    const vErr = validateCvv(cvv, cardBrand);

    if (cErr || nErr || eErr || vErr) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await processPaymentApi(priceBreakdown.total, cardBrand, cardNumber);
      if (result.success) {
        const clean = cardNumber.replace(/\s+/g, '');
        const last4 = clean.slice(-4) || '8888';
        const brandName = cardBrand === 'amex' ? 'American Express' : cardBrand === 'mastercard' ? 'Mastercard' : 'Visa';
        onPaymentSuccess({ brand: brandName, last4 });
      } else {
        setPaymentError(result.error || 'Payment was declined by card network.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Network communication error during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <Text style={styles.headerTitle}>Review & Pay</Text>
            <Text style={styles.headerSubtitle}>End-to-end 256-bit encrypted checkout</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Flight & Fare Summary</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(priceBreakdown.total)}</Text>
            </View>

            <View style={styles.summaryFlightRow}>
              <Text style={styles.summaryFlightText}>
                {flight.airlineName} • {flight.departureAirport.code} → {flight.arrivalAirport.code}
              </Text>
              <Text style={styles.summaryDateText}>{formatFlightDate(flight.departureTime)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Fare ({priceBreakdown.passengerCount} traveler(s))</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(priceBreakdown.baseFare)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Airport Taxes & Security Fees</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(priceBreakdown.taxesAndFees)}</Text>
            </View>
            {priceBreakdown.seatFees > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Selected Seat Assignments</Text>
                <Text style={styles.breakdownVal}>{formatCurrency(priceBreakdown.seatFees)}</Text>
              </View>
            )}
          </View>

          {/* Payment Card Inputs */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardHeader}>
              <CreditCard size={18} color="#0284c7" />
              <Text style={styles.paymentCardTitle}>Credit or Debit Card</Text>
            </View>

            {/* Card Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CARD NUMBER</Text>
              <View style={[styles.inputContainer, cardNumberError && styles.inputError]}>
                <CreditCard size={16} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  placeholder="4000 1234 5678 9010"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              {cardNumberError && <Text style={styles.errorText}>{cardNumberError}</Text>}
            </View>

            {/* Name on Card */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
              <TextInput
                style={[styles.singleTextInput, cardHolderError && styles.inputError]}
                value={cardHolder}
                onChangeText={handleCardHolderChange}
                placeholder="FIRST LAST"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
              />
              {cardHolderError && <Text style={styles.errorText}>{cardHolderError}</Text>}
            </View>

            {/* Expiry and CVV Row */}
            <View style={styles.splitRow}>
              {/* Expiry MM/YY */}
              <View style={styles.splitCol}>
                <Text style={styles.fieldLabel}>EXPIRY (MM/YY)</Text>
                <TextInput
                  style={[styles.singleTextInput, expiryError && styles.inputError]}
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  placeholder="MM/YY"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={5}
                />
                {expiryError && <Text style={styles.errorText}>{expiryError}</Text>}
              </View>

              {/* CVV */}
              <View style={styles.splitCol}>
                <Text style={styles.fieldLabel}>CVV / CVC</Text>
                <View style={[styles.inputContainer, cvvError && styles.inputError]}>
                  <Lock size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    value={cvv}
                    onChangeText={handleCvvChange}
                    placeholder="123"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    secureTextEntry={true}
                    maxLength={4}
                  />
                </View>
                {cvvError && <Text style={styles.errorText}>{cvvError}</Text>}
              </View>
            </View>

            {/* Payment decline error banner */}
            {paymentError && (
              <View style={styles.errorBanner}>
                <AlertTriangle size={16} color="#e11d48" />
                <Text style={styles.errorBannerText}>{paymentError}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Pay Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
            disabled={isProcessing}
            onPress={handlePay}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.payButtonText}>
                Confirm & Pay {formatCurrency(priceBreakdown.total)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    gap: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  summaryFlightRow: {
    marginVertical: 8,
  },
  summaryFlightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  singleTextInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#f43f5e',
    backgroundColor: '#fff1f2',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 8,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCol: {
    flex: 1,
    gap: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#f43f5e',
    fontWeight: '500',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  payButton: {
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
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
