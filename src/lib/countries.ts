/**
 * Country dial codes for the phone-number selector.
 * Order: United States first, India second, then the rest alphabetically.
 * `flag` is the emoji flag; `dial` is the E.164 calling code.
 */
export interface Country {
  name: string;
  iso: string;
  dial: string;
  flag: string;
}

/** The two pinned entries, in display order. */
const PINNED: Country[] = [
  { name: "United States", iso: "US", dial: "+1", flag: "🇺🇸" },
  { name: "India", iso: "IN", dial: "+91", flag: "🇮🇳" },
];

/** Everyone else — sorted alphabetically by name below. */
const REST: Country[] = [
  { name: "Afghanistan", iso: "AF", dial: "+93", flag: "🇦🇫" },
  { name: "Albania", iso: "AL", dial: "+355", flag: "🇦🇱" },
  { name: "Algeria", iso: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Argentina", iso: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Australia", iso: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Austria", iso: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Bahrain", iso: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", iso: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Belgium", iso: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Brazil", iso: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Bulgaria", iso: "BG", dial: "+359", flag: "🇧🇬" },
  { name: "Canada", iso: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Chile", iso: "CL", dial: "+56", flag: "🇨🇱" },
  { name: "China", iso: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Colombia", iso: "CO", dial: "+57", flag: "🇨🇴" },
  { name: "Croatia", iso: "HR", dial: "+385", flag: "🇭🇷" },
  { name: "Czechia", iso: "CZ", dial: "+420", flag: "🇨🇿" },
  { name: "Denmark", iso: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Egypt", iso: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Finland", iso: "FI", dial: "+358", flag: "🇫🇮" },
  { name: "France", iso: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Germany", iso: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "Ghana", iso: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Greece", iso: "GR", dial: "+30", flag: "🇬🇷" },
  { name: "Hong Kong", iso: "HK", dial: "+852", flag: "🇭🇰" },
  { name: "Hungary", iso: "HU", dial: "+36", flag: "🇭🇺" },
  { name: "Indonesia", iso: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Iran", iso: "IR", dial: "+98", flag: "🇮🇷" },
  { name: "Iraq", iso: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Ireland", iso: "IE", dial: "+353", flag: "🇮🇪" },
  { name: "Israel", iso: "IL", dial: "+972", flag: "🇮🇱" },
  { name: "Italy", iso: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Japan", iso: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "Jordan", iso: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Kenya", iso: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Kuwait", iso: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Malaysia", iso: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Mexico", iso: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Morocco", iso: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Nepal", iso: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Netherlands", iso: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "New Zealand", iso: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Nigeria", iso: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Norway", iso: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Oman", iso: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Pakistan", iso: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Philippines", iso: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Poland", iso: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Portugal", iso: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Qatar", iso: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Romania", iso: "RO", dial: "+40", flag: "🇷🇴" },
  { name: "Russia", iso: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Singapore", iso: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "South Africa", iso: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "South Korea", iso: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "Spain", iso: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", iso: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Sweden", iso: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Switzerland", iso: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Taiwan", iso: "TW", dial: "+886", flag: "🇹🇼" },
  { name: "Thailand", iso: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Turkey", iso: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Ukraine", iso: "UA", dial: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", iso: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "Vietnam", iso: "VN", dial: "+84", flag: "🇻🇳" },
];

export const COUNTRIES: Country[] = [
  ...PINNED,
  ...REST.sort((a, b) => a.name.localeCompare(b.name)),
];

/** Default selection — United States, the first pinned entry. */
export const DEFAULT_COUNTRY = PINNED[0];
