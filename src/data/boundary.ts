// Farm boundary from the cadastral map (Kadastrale kaart) compiled by Boundary Hunter, September 2014,
// from SA Surveyor General data. Beacon coordinates are WGS84, as printed in the map's table.
// Portion 54 of Weltevreden 80 (beacons A to U) was sold and is left out.

export type LatLng = [number, number];

/** Survey beacons of the farm, named as on the cadastral map. */
const BEACON = {
  V: [-33.507015, 21.380010],
  W: [-33.503344, 21.386022],
  X: [-33.509305, 21.393364],
  Y: [-33.517152, 21.387586],
  Z: [-33.520017, 21.389723],
  A1: [-33.520631, 21.389028],
  B1: [-33.522309, 21.388916],
  C1: [-33.524122, 21.389549],
  D1: [-33.525369, 21.390611],
  E1: [-33.526553, 21.392672],
  F1: [-33.528663, 21.399415],
  G1: [-33.528746, 21.405849],
  H1: [-33.530083, 21.412092],
  J1: [-33.530822, 21.416220],
  K1: [-33.533747, 21.425969],
  L1: [-33.535550, 21.429654],
  M1: [-33.543957, 21.445375],
  N1: [-33.546429, 21.449155],
  P1: [-33.551504, 21.456016],
  Q1: [-33.552669, 21.458357],
  R1: [-33.553037, 21.460100],
  S1: [-33.553620, 21.466325],
  T1: [-33.559372, 21.485594],
  U1: [-33.561739, 21.490505],
  V1: [-33.562149, 21.483635],
  W1: [-33.569101, 21.483728],
  X1: [-33.571078, 21.483255],
  Y1: [-33.571206, 21.483378],
  Z1: [-33.572776, 21.483361],
  A2: [-33.572799, 21.483297],
  B2: [-33.573422, 21.482925],
  C2: [-33.573457, 21.482999],
  D2: [-33.574384, 21.481145],
  E2: [-33.576549, 21.479408],
  F2: [-33.579696, 21.479938],
  G2: [-33.581679, 21.481365],
  H2: [-33.593094, 21.473401],
  J2: [-33.597732, 21.469126],
  K2: [-33.597914, 21.459794],
  L2: [-33.600013, 21.433014],
  M2: [-33.551228, 21.426547],
  N2: [-33.552296, 21.420429],
  P2: [-33.554096, 21.405646],
  Q2: [-33.553635, 21.405310],
  R2: [-33.537113, 21.413212],
  S2: [-33.538383, 21.397544],
  T2: [-33.537927, 21.395184],
  U2: [-33.537141, 21.393037],
  V2: [-33.533832, 21.380259],
  W2: [-33.536075, 21.376433],
  X2: [-33.517880, 21.361632],
  Y2: [-33.510432, 21.370425],
  Z2: [-33.562257, 21.451396],
  A3: [-33.568336, 21.468891],
} satisfies Record<string, LatLng>;

type BeaconId = keyof typeof BEACON;

const ring = (ids: string): LatLng[] => ids.split(' ').map((id) => BEACON[id as BeaconId]);

export interface Portion {
  /** Portion number as on the title deed, such as 1/162 (portion 1 of farm 162). */
  id: string;
  name: string;
  /** Registered area in hectares. */
  ha: number;
  ring: LatLng[];
  /** Where the name goes on the map. */
  label: LatLng;
}

export const PORTIONS: Portion[] = [
  { id: '16/80', name: 'Weltevreden', ha: 115.6318, ring: ring('V W X Y'), label: [-33.509896, 21.386956] },
  { id: '161', name: 'Breede Nek', ha: 509.0798, ring: ring('V Y Z A1 B1 C1 D1 E1 V2 W2 X2 Y2'), label: [-33.520538, 21.37817] },
  { id: '1/162', name: 'Oude Kloof', ha: 270.6954, ring: ring('E1 F1 G1 H1 J1 R2 S2 T2 U2 V2'), label: [-33.533703, 21.399037] },
  { id: '164', name: 'Annex Geelbosch Laagte', ha: 3.783, ring: ring('N2 P2 Q2'), label: [-33.553343, 21.410462] },
  { id: '165', name: 'Geelbosch Laagte', ha: 990.151, ring: ring('J1 K1 L1 M1 N1 P1 Q1 R1 S1 A3 Z2 M2 N2 Q2 R2'), label: [-33.548594, 21.437706] },
  { id: '286', name: 'Plaas 286', ha: 2009.7318, ring: ring('M2 Z2 A3 S1 T1 U1 V1 W1 X1 Y1 Z1 A2 B2 C2 D2 E2 F2 G2 H2 J2 K2 L2'), label: [-33.578336, 21.459937] },
];

/** The outside boundary of the whole farm. */
export const BOUNDARY: LatLng[] = ring(
  'V W X Y Z A1 B1 C1 D1 E1 F1 G1 H1 J1 K1 L1 M1 N1 P1 Q1 R1 S1 T1 U1 V1 W1 X1 Y1 Z1 A2 B2 C2 D2 E2 F2 G2 H2 J2 K2 L2 M2 N2 P2 Q2 R2 S2 T2 U2 V2 W2 X2 Y2',
);

/** Registered area of the farm in hectares: the sum of its portions. */
export const FARM_HA = Math.round(PORTIONS.reduce((sum, p) => sum + p.ha, 0));

function inside([lat, lng]: LatLng, points: LatLng[]): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[j];
    if (lat1 > lat !== lat2 > lat && lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1) hit = !hit;
  }
  return hit;
}

/** The portion a position is in, or undefined when it is outside the farm. */
export function portionAt(lat: number, lng: number): Portion | undefined {
  return PORTIONS.find((p) => inside([lat, lng], p.ring));
}
