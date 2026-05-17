export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestPlace(
  lat: number,
  lng: number,
  places: { lat: number; lng: number; name: string }[]
): { name: string; distance: number } | null {
  if (places.length === 0) return null;
  let nearest = places[0];
  let minDist = distance(lat, lng, nearest.lat, nearest.lng);
  for (const place of places) {
    const d = distance(lat, lng, place.lat, place.lng);
    if (d < minDist) {
      minDist = d;
      nearest = place;
    }
  }
  return { name: nearest.name, distance: Math.round(minDist * 10) / 10 };
}

export function getMapCenter(geojson: GeoJSON.FeatureCollection): [number, number] {
  const coords: number[][] = [];
  for (const feature of geojson.features) {
    const geom = feature.geometry as GeoJSON.MultiPolygon;
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        for (const coord of ring) {
          coords.push(coord);
        }
      }
    }
  }
  if (coords.length === 0) return [30.0, 120.0];
  const sumLng = coords.reduce((s, c) => s + c[0], 0);
  const sumLat = coords.reduce((s, c) => s + c[1], 0);
  return [sumLat / coords.length, sumLng / coords.length];
}
