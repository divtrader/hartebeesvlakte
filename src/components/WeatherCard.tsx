import { Icon } from './Icon';
import { formatDay, formatTime } from '../lib/format';
import { WEATHER_PLACE, useWeather, weatherIcon, weatherWords } from '../lib/weather';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Today's weather at the farm (Yr's Toit's Dam location), with the next few days. */
export function WeatherCard() {
  const forecast = useWeather();
  if (!forecast) {
    return (
      <section className="card weather weather--empty">
        <Icon name="cloudSun" size={28} />
        <span>The forecast for {WEATHER_PLACE.name} shows here once the phone has signal.</span>
      </section>
    );
  }
  const { now, days } = forecast;
  const today = days[0]?.date;
  return (
    <section className="card weather" aria-label={`Weather at ${WEATHER_PLACE.name}`}>
      <div className="weather__now">
        <Icon name={weatherIcon(now.symbol)} size={46} strokeWidth={1.6} className="weather__icon" />
        <div className="weather__temp">
          <strong>{now.temp}°</strong>
          <span>{weatherWords(now.symbol)}</span>
        </div>
        <div className="weather__side">
          <span>
            <Icon name="wind" size={16} /> {now.windKmh} km/h
          </span>
          <span>
            <Icon name="drop" size={16} /> {now.rainNext6h} mm next 6 h
          </span>
        </div>
      </div>
      <div className="weather__days">
        {days.slice(0, 5).map((d) => {
          const date = new Date(`${d.date}T12:00:00`);
          return (
            <div key={d.date} className="weather__day">
              <span>{d.date === today ? 'Today' : DAY_NAMES[date.getDay()]}</span>
              <Icon name={weatherIcon(d.symbol)} size={24} strokeWidth={1.7} />
              <strong>{d.max}°</strong>
              <small>{d.min}°</small>
              {d.rain > 0 && <small className="weather__rain">{d.rain} mm</small>}
            </div>
          );
        })}
      </div>
      <a className="weather__credit" href={WEATHER_PLACE.yrUrl} target="_blank" rel="noreferrer">
        {WEATHER_PLACE.name} · Yr, MET Norway · updated {formatDay(forecast.fetched).toLowerCase()} {formatTime(forecast.fetched)}
      </a>
    </section>
  );
}
