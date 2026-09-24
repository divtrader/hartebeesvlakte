import { useEffect } from 'react';
import { setSetting, useSetting } from '../db';
import type { IconName } from '../components/icons';

// The farm uses yr.no's "Toit's Dam" location; the forecast comes from MET Norway, the service behind Yr.
export const WEATHER_PLACE = {
  name: "Toit's Dam",
  lat: -33.5402,
  lon: 21.4234,
  altitude: 674,
  yrUrl: 'https://www.yr.no/en/forecast/daily-table/2-948551/',
};

const API = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${WEATHER_PLACE.lat}&lon=${WEATHER_PLACE.lon}&altitude=${WEATHER_PLACE.altitude}`;
const STALE_MS = 30 * 60_000;

export interface Forecast {
  /** When this device fetched it. */
  fetched: number;
  now: { temp: number; windKmh: number; symbol: string; rainNext6h: number };
  days: { date: string; min: number; max: number; symbol: string; rain: number }[];
}

interface Entry {
  time: string;
  data: {
    instant: { details: { air_temperature: number; wind_speed?: number } };
    next_1_hours?: { summary: { symbol_code: string }; details?: { precipitation_amount?: number } };
    next_6_hours?: { summary: { symbol_code: string }; details?: { precipitation_amount?: number } };
    next_12_hours?: { summary: { symbol_code: string } };
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function localDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Turns MET's hourly and six hourly forecast into "now" and one line per day. */
export function parseForecast(json: { properties?: { timeseries?: Entry[] } }, fetched = Date.now()): Forecast | undefined {
  const series = json?.properties?.timeseries;
  if (!Array.isArray(series) || !series.length) return undefined;
  const first = series[0].data;
  const symbolOf = (e: Entry['data']) => e.next_1_hours?.summary.symbol_code ?? e.next_6_hours?.summary.symbol_code ?? e.next_12_hours?.summary.symbol_code ?? 'cloudy';
  const now = {
    temp: Math.round(first.instant.details.air_temperature),
    windKmh: Math.round((first.instant.details.wind_speed ?? 0) * 3.6),
    symbol: symbolOf(first),
    rainNext6h: round1(first.next_6_hours?.details?.precipitation_amount ?? 0),
  };

  const byDay = new Map<string, { temps: number[]; rain: number; symbol?: string; noonGap: number }>();
  for (const e of series) {
    const ms = Date.parse(e.time);
    const date = localDate(ms);
    const day = byDay.get(date) ?? { temps: [], rain: 0, noonGap: 99 };
    day.temps.push(e.data.instant.details.air_temperature);
    // Hourly steps carry next_1_hours; later six hourly steps only next_6_hours. Count each hour once.
    if (e.data.next_1_hours) day.rain += e.data.next_1_hours.details?.precipitation_amount ?? 0;
    else if (e.data.next_6_hours) day.rain += e.data.next_6_hours.details?.precipitation_amount ?? 0;
    const gap = Math.abs(new Date(ms).getHours() - 12);
    const sym = e.data.next_6_hours?.summary.symbol_code ?? e.data.next_1_hours?.summary.symbol_code;
    if (sym && gap < day.noonGap) {
      day.symbol = sym;
      day.noonGap = gap;
    }
    byDay.set(date, day);
  }
  const days = [...byDay.entries()]
    .filter(([, d]) => d.temps.length >= 3 && d.symbol)
    .slice(0, 5)
    .map(([date, d]) => ({ date, min: Math.round(Math.min(...d.temps)), max: Math.round(Math.max(...d.temps)), symbol: d.symbol!, rain: round1(d.rain) }));
  return { fetched, now, days };
}

export async function refreshWeather(): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const response = await fetch(API);
    if (!response.ok) return;
    const forecast = parseForecast(await response.json());
    if (forecast) await setSetting('weather', forecast);
  } catch {
    // No signal; keep the last forecast.
  }
}

/** The latest forecast on this device, refreshed when it is more than half an hour old. */
export function useWeather(): Forecast | undefined {
  const forecast = useSetting<Forecast | undefined>('weather', undefined);
  const fetched = forecast?.fetched ?? 0;
  useEffect(() => {
    if (Date.now() - fetched > STALE_MS) void refreshWeather();
  }, [fetched]);
  return forecast;
}

/** Icon for a MET/Yr symbol code such as partlycloudy_day or lightrainshowers_night. */
export function weatherIcon(code: string): IconName {
  const night = code.endsWith('_night');
  const c = code.replace(/_(day|night|polartwilight)$/, '');
  if (c.includes('thunder')) return 'storm';
  if (c.includes('snow') || c.includes('sleet')) return 'snow';
  if (c.includes('rain')) return 'rain';
  if (c === 'fog') return 'fog';
  if (c === 'cloudy') return 'cloud';
  if (c === 'partlycloudy' || c === 'fair') return night ? 'cloudMoon' : 'cloudSun';
  return night ? 'moon' : 'sun';
}

/** "partlycloudy_day" to "Partly cloudy", "lightrainshowers_night" to "Light rain showers". */
export function weatherWords(code: string): string {
  const words = code
    .replace(/_(day|night|polartwilight)$/, '')
    .replace('clearsky', 'clear sky ')
    .replace('partlycloudy', 'partly cloudy ')
    .replace(/(light|heavy)/g, '$1 ')
    .replace(/and/g, ' and ')
    .replace(/(rain|sleet|snow)(showers)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
