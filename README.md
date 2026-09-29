# Morfikos Flights — React Native & Expo Mobile Application

> **Submission for Morfikos Product Designer / Frontend Engineering Intern Screening**  
> Built with **React Native**, **Expo SDK**, and **TypeScript**.

---

## 1. Quick Start & How to Run

### Prerequisites
- **Node.js** (v18 or higher)
- **Expo Go** app on your physical iOS or Android phone (or an iOS Simulator / Android Emulator).

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Start Expo bundler with clean cache
npx expo start -c
```
- **Physical Phone**: Scan the QR code shown in the terminal using the Expo Go app.
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal.
- **Web Preview**: Run `npm run dev` to view on desktop.

---

## 2. Data Source & Keying Strategy

- **Architectural Choice**: **Self-contained asynchronous mock fixture layer (`src/services/flightApi.ts`)**.
- **Rationale**: Public flight sandboxes (Amadeus, AviationStack, Skyscanner) have rate limits, frequent downtime, and unstable sandbox credentials during offline or mobile reviews. Per Section 03 of the brief, we structured the fixture layer as a **true network simulation**:
  - `async` / `Promise` based resolution with realistic network latency (500ms–800ms).
  - Explicit loading states with animated skeleton shimmers.
  - Realistic error handling and empty search states.
  - Configurable route generators supporting 25+ international hubs with real IATA codes, terminals, flight numbers, aircraft models (`A350-900`, `B787-9`), and layovers.
- **API Key Configuration**: If switching to a live provider (e.g. Amadeus), keys are kept out of source code and read from environment variables via `process.env.EXPO_PUBLIC_FLIGHT_API_KEY`.

---

## 3. What Was Built (The 5 Core Screens + Good-to-Haves)

### Core Must-Haves:
1. **Search Screen (`SearchScreen.tsx`)**:
   - One-Way / Round-Trip segmented switch.
   - Searchable airport picker modal with fuzzy city/airport search and quick reverse route swap.
   - Visual calendar modal with past-date blocking and logical date constraints (return date strictly $\ge$ departure date).
   - Passenger stepper modal (Adults, Children, Infants) and cabin class selector (Economy / Business).
   - Strict validation preventing identical origin/destination or invalid dates.

2. **Results Screen (`ResultsScreen.tsx`)**:
   - High-density comparative flight cards displaying airline, flight number, aircraft, timeline, duration, stops, layover airport, and clear total pricing.
   - Instant sorting: Price (low-high), Duration (shortest), and Departure Time (earliest).
   - Real-time filters: Stops (Direct vs 1 Stop) and Airlines.
   - Honest states: Animated skeleton loading cards, empty search fallback with actionable reset, and network error state.

3. **Flight Detail Screen (`FlightDetailScreen.tsx`)**:
   - Full segmented leg-by-leg itinerary with departure/arrival terminals, layovers, and aircraft details.
   - Baggage allowance disclosure (cabin + checked bags).
   - Complete itemized price breakdown (base fare, airport tax, fuel surcharge).
   - Prominent, sticky 44px+ CTA to continue.

4. **Passenger Details Screen (`PassengerFormScreen.tsx`)**:
   - Dynamic passenger form generation based on search count.
   - **Instant non-alpha rejection**: Keyboard input immediately ignores digits/symbols in name fields at keystroke time.
   - **Optional last name**: Respects mononymous travelers and flexible booking standards.
   - Keyboard avoiding and auto-scroll behavior ensuring forms remain fully usable while typing.
   - Inline real-time validation and error badges.

5. **Confirmation Screen (`ConfirmationScreen.tsx`)**:
   - Airline digital boarding pass card with PNR reservation reference (`MF-XXXXX`), QR code, seat numbers, and passenger manifest.
   - Local persistence via `@react-native-async-storage/async-storage` surviving app kills and restarts.

### Good-to-Haves Implemented:
- **Interactive Seat Selection (`SeatSelectionScreen.tsx`)**: Visual aircraft cabin fuselage, seat pricing, occupied states, and multi-passenger seat selector tabs.
- **Mocked Payment Gateway (`PaymentScreen.tsx`)**: Auto-formatting card number with dynamic card issuer detection (Visa, Mastercard, Amex), expiry/CVV validation, and simulated payment processing.
- **My Trips Management (`MyTripsScreen.tsx`)**: Full booking manager with **All**, **Upcoming**, and **Cancelled** views, refund status tags, and instant cancellation. Pre-seeded with 3 realistic bookings on fresh installs for immediate evaluation.
- **Motion & Polish**: Animated skeleton loaders, native Android `BackHandler` hardware navigation, tactile haptic feedback (`Vibration.vibrate`), accessible touch targets ($\ge 44\text{px}$), and safe area compliance.

---

## 4. What Was Deliberately Left Out (Scope Cuts)

In accordance with Section 01 (*"Cut scope rather than shipping something broken"*):
1. **Real Payment Gateway Integration (Stripe SDK)**: Omitted to prevent dependency on sandbox merchant keys; replaced with an authentic client-side card validation and payment flow.
2. **User Authentication & Social Login**: Omitted full OAuth backend login; bookings are keyed to the local device storage (`AsyncStorage`) allowing instant, friction-free booking without login barriers.
3. **Complex Multi-City Matrix Search**: Prioritized making the primary One-Way and Round-Trip booking paths bulletproof rather than offering a half-functional multi-city builder.

---

## 5. Key Decisions Defended in Review

### Decision 1: Root State Elevation vs. Global Store Bloat
- **Decision**: Centralized the flight booking flow state in the top-level `App.tsx` container while encapsulating screen-specific UI state within individual components.
- **Defense**: For a strict 5-screen linear booking funnel, heavy state libraries (like Redux or Zustand) introduce unnecessary boilerplate and serialization overhead. Lifting state to a clean React container maintains rapid screen transitions, guarantees state survives backward/forward navigation, and provides effortless offline persistence.

### Decision 2: Keystroke-Level Input Rejection Over Post-Submission Validation
- **Decision**: In `PassengerFormScreen.tsx`, non-alphabet characters are blocked directly inside `onChangeText` before updating component state, while keeping `lastName` explicitly optional.
- **Defense**: Post-validation (where an invalid character flashes for a second or only errors on submit) creates cognitive friction. Immediate rejection at keystroke level guarantees that invalid data can never enter the pipeline while accommodating mononymous international passengers.

### Decision 3: Deterministic Asynchronous Fixture Layer Over Unstable Free APIs
- **Decision**: Built a rich, fully typed mock data service with realistic asynchronous delays and comprehensive flight metadata rather than relying on free-tier flight APIs.
- **Defense**: Free-tier flight APIs suffer from strict rate limits (e.g. 500 requests/month), incomplete test data in sandboxes, and network fragility during live reviewer evaluations. Our fixture simulates every real-world network condition (loading latency, empty results, error states, and layover itineraries) while ensuring 100% test reliability on any reviewer's device.

---

## 6. AI Tools Disclosure

- AI tools (Google AI Studio Build & Gemini) were utilized for rapid boilerplate generation, airport IATA database structuring, and edge-case testing assistance.
- All application architecture, TypeScript interfaces, validation heuristics, and component styling have been reviewed, refined, and verified for production-grade craft and defense.

---

## 7. What We Would Build Next With Another Week

1. **EAS Build & Universal Deep Linking**: Configure `expo-linking` for deep-linking directly into flight deals from push notifications or email confirmations (`morfikos://flight/MF-8924A`).
2. **Offline-First SQLite Cache**: Migrate from basic key-value storage to SQLite (`expo-sqlite`) for historical flight search caching and offline e-ticket access in airplane mode.
3. **Flight Status Tracking & Live Activities**: Integrate push notifications or iOS Dynamic Island / Live Activities for real-time gate changes and departure countdowns.
