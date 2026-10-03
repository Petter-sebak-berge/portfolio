// A Route Handler: a small API endpoint of our own, available at /api/weather.
// The browser asks *us* for the weather, and we ask MET Norway (the Norwegian Meteorological
// Institute). Going through our own server lets us identify the site the way MET requires, send the
// browser only the four numbers it needs, and cache the answer so we don't ask MET too often.

import { BERGEN, type Weather } from "../../../lib/sky";

const MET_URL = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${BERGEN.lat}&lon=${BERGEN.lon}`;

export async function GET() {
  try {
    const response = await fetch(MET_URL, {
      // MET's terms of service ask every app to say who it is. This is public information, not a secret.
      headers: { "User-Agent": "servereniskogen.no https://www.servereniskogen.no" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`MET responded with ${response.status}`);

    // The forecast is a list of hours. The first entry is the current hour.
    const forecast = await response.json();
    const current = forecast.properties.timeseries[0].data;
    const details = current.instant.details;

    const weather: Weather = {
      temperature: details.air_temperature,
      wind: details.wind_speed,
      cloud: details.cloud_area_fraction / 100,
      symbol: (current.next_1_hours ?? current.next_6_hours).summary.symbol_code,
    };

    return Response.json(weather, {
      // s-maxage tells Vercel's network to keep this answer for 30 minutes and reuse it for every
      // visitor, so MET gets at most two requests an hour from us however many people visit.
      headers: { "Cache-Control": "public, max-age=300, s-maxage=1800" },
    });
  } catch (error) {
    console.error("Weather lookup failed:", error);
    // 502 = "the service I depend on failed". The scene still works, it just skips the weather.
    return Response.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
