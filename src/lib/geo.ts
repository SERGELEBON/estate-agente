/** Countries served by State-ImmoCom. Properties store the country NAME, schools store the CODE. */
export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string; // ISO 4217 used for prices
  francophone: boolean;
  cities: string[];
}

export const COUNTRIES: CountryInfo[] = [
  { code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", francophone: false, cities: ["Accra", "Kumasi", "Koforidua", "Tema", "Takoradi", "Cape Coast", "Tamale"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", francophone: true, cities: ["Abidjan", "Grand-Bassam", "Yamoussoukro", "Bouaké", "San-Pédro"] },
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF", francophone: true, cities: ["Lomé", "Kpalimé", "Kara"] },
  { code: "BJ", name: "Benin", flag: "🇧🇯", currency: "XOF", francophone: true, cities: ["Cotonou", "Abomey-Calavi", "Porto-Novo", "Ouidah", "Parakou"] },
  { code: "SN", name: "Senegal", flag: "🇸🇳", currency: "XOF", francophone: true, cities: ["Dakar", "Saly", "Saint-Louis", "Thiès"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", francophone: true, cities: ["Ouagadougou", "Bobo-Dioulasso"] },
];

export const FRANCOPHONE_COUNTRY_NAMES = COUNTRIES.filter((c) => c.francophone).map((c) => c.name);
export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export function countryByCode(code?: string | null) {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

export function countryByName(name?: string | null) {
  return COUNTRIES.find((c) => c.name.toLowerCase() === (name ?? "").toLowerCase()) ?? null;
}

/** "Ghana" → "GHC" (the legacy code the property module uses for cedis), else the country currency. */
export function propertyCurrencyFor(countryName: string) {
  const c = countryByName(countryName);
  return !c || c.code === "GH" ? "GHC" : c.currency;
}
