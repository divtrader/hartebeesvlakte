export type Season = 'Summer' | 'Autumn' | 'Winter' | 'Spring';

export const SEASONS: Record<Season, { af: string; colour: string; tint: string; deep: string }> = {
  Summer: { af: 'Somer', colour: '#9A6412', tint: '#F3E6C8', deep: '#5E4210' },
  Autumn: { af: 'Herfs', colour: '#9C4A22', tint: '#F1DDD0', deep: '#6E3419' },
  Winter: { af: 'Winter', colour: '#466178', tint: '#DFE6EC', deep: '#34495A' },
  Spring: { af: 'Lente', colour: '#56702A', tint: '#E5EBD3', deep: '#3B4524' },
};

export interface MonthGuide {
  short: string;
  name: string;
  season: Season;
  birds: string;
  animals: string;
  veld: string;
}

// What usually happens in this part of the Klein Karoo. The farm's own records refine this over the years.
export const MONTHS: MonthGuide[] = [
  { short: 'Jan', name: 'January', season: 'Summer', birds: 'Bee-eaters, swallows and cuckoos are all here', animals: 'Kudu calves appear; snakes are active', veld: 'Hot, dry days. Check water points often' },
  { short: 'Feb', name: 'February', season: 'Summer', birds: 'Summer migrants still present', animals: 'Kudu calving continues', veld: 'Hottest month. Dams at their lowest' },
  { short: 'Mar', name: 'March', season: 'Autumn', birds: 'Bee-eaters leave for the north', animals: 'Springbok rut begins', veld: 'Autumn rains start' },
  { short: 'Apr', name: 'April', season: 'Autumn', birds: 'Swallows gather and leave', animals: 'Kudu rut', veld: 'Autumn rain peak' },
  { short: 'May', name: 'May', season: 'Autumn', birds: 'Sunbirds move to the aloes', animals: 'Tortoises slow down', veld: 'First frost possible' },
  { short: 'Jun', name: 'June', season: 'Winter', birds: "Verreaux's eagles on eggs", animals: 'Tortoises and snakes are dormant', veld: 'Frost; snow on the high peaks' },
  { short: 'Jul', name: 'July', season: 'Winter', birds: 'Residents only; good raptor watching', animals: 'Thin cover makes this a good month to count game', veld: 'Coldest month' },
  { short: 'Aug', name: 'August', season: 'Winter', birds: 'Karoo korhaans start calling', animals: 'Yearly game count', veld: 'Wind and early spring rain' },
  { short: 'Sep', name: 'September', season: 'Spring', birds: 'Bee-eaters and swallows start to return', animals: 'Tortoises are out again; snakes wake up', veld: 'Spring rain; the veld greens up' },
  { short: 'Oct', name: 'October', season: 'Spring', birds: 'Diederik cuckoos calling', animals: 'Springbok lambs after good rain', veld: 'Spring rain peak' },
  { short: 'Nov', name: 'November', season: 'Spring', birds: 'Breeding peak for many species', animals: 'Klipspringer lambs', veld: 'The heat builds' },
  { short: 'Dec', name: 'December', season: 'Summer', birds: 'All summer migrants present', animals: 'Animals stay near water at midday', veld: 'Hot; check water points daily' },
];

/** Guide for a month, 1 to 12. */
export function monthGuide(month: number): MonthGuide {
  return MONTHS[(month - 1 + 12) % 12];
}
