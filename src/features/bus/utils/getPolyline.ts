// src/utils/getPolyline.ts

import { GeoPolylineData } from "@bus/types/data";

// 캐시용 객체
const cache: Record<string, GeoPolylineData> = {};
const pending: Record<string, Promise<GeoPolylineData>> = {};

/**
 * {routeName}.geojson 파일을 fetch하여 캐싱합니다.
 *
 * @param routeName - 경로 이름
 * @returns {Promise<GeoPolylineData>} - GeoJSON 데이터
 * @throws {Error} - 요청 실패 시 에러 발생
 */
export async function getPolyline(routeName: string): Promise<GeoPolylineData> {
  // 캐시된 데이터가 있으면 바로 반환
  if (cache[routeName]) return cache[routeName];

  // 진행 중인 요청이 있으면 해당 프로미스 반환
  if (await pending[routeName]) return pending[routeName];

  // 새 요청 시작
  pending[routeName] = fetch(`/data/polylines/${routeName}.geojson`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`🚫 Polyline 요청 실패: ${routeName}`);
      }
      return res.json();
    })
    .then((json: GeoPolylineData) => {
      cache[routeName] = json;
      return json;
    })
    .finally(() => {
      delete pending[routeName];
    });

  return pending[routeName];
}

/**
 * GeoJSON 데이터를 좌표 변환 후 상행과 하행 폴리라인으로 분리합니다.
 *
 * @param data - GeoJSON 데이터
 * @returns {{ upPolyline: [number, number][][], downPolyline: [number, number][][] }}
 */
export function transformPolyline(data: GeoPolylineData) {
  const upPolyline: [number, number][][] = [];
  const downPolyline: [number, number][][] = [];

  data.features.forEach((feature) => {
    const coords = feature.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
    if (feature.properties.updnDir === "1") upPolyline.push(coords);
    else if (feature.properties.updnDir === "0") downPolyline.push(coords);
  });

  return { upPolyline, downPolyline };
}

/**
 * 두 폴리라인을 병합합니다.
 *
 * @param polylines - 병합할 폴리라인 배열
 * @returns - 병합된 폴리라인
 */
export function mergePolylines(
  polylines: [number, number][][]
): [number, number][] {
  return polylines
    .flat()
    .reduce<[number, number][]>((merged, point, index, arr) => {
      if (
        index === 0 ||
        point[0] !== arr[index - 1][0] ||
        point[1] !== arr[index - 1][1]
      ) {
        merged.push(point);
      }
      return merged;
    }, []);
}

/**
 * 방위각(Bearing)을 계산한다 (북 = 0도, 시계방향 증가)
 */
export function calculateBearing(
  A: [number, number],
  B: [number, number]
): number {
  const [lat1, lon1] = A.map((d) => (d * Math.PI) / 180);
  const [lat2, lon2] = B.map((d) => (d * Math.PI) / 180);
  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * 주어진 점 P를 선분 AB에 수직으로 투영하여
 * 선분 AB 위의 점을 반환합니다.
 *
 * @param P - 투영할 점
 * @param A - 선분의 시작점
 * @param B - 선분의 끝점
 * @returns - 선분 AB 위의 점
 */
function projectPointOnSegment(
  P: [number, number],
  A: [number, number],
  B: [number, number]
): [number, number] {
  const AP = [P[0] - A[0], P[1] - A[1]];
  const AB = [B[0] - A[0], B[1] - A[1]];
  const ab2 = AB[0] * AB[0] + AB[1] * AB[1];
  const dot = AP[0] * AB[0] + AP[1] * AB[1];
  let t = dot / ab2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return [A[0] + AB[0] * t, A[1] + AB[1] * t];
}

/**
 * 두 점 P와 Q 사이의 유클리드 거리를 계산합니다.
 * (좌표 순서는 [lat, lng])
 *
 * @param P - 첫 번째 점
 * @param Q - 두 번째 점
 * @returns - 두 점 사이의 거리
 */
function distance(P: [number, number], Q: [number, number]): number {
  const dx = P[0] - Q[0];
  const dy = P[1] - Q[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 좌표 A와 B 사이의 방향(회전각)을 계산합니다.
 * (좌표 순서는 [lat, lng])
 */
export function calculateAngle(
  A: [number, number],
  B: [number, number]
): number {
  const deltaLat = B[0] - A[0];
  const deltaLng = B[1] - A[1];
  return (Math.atan2(deltaLat, deltaLng) * 180) / Math.PI;
}

/**
 * 버스 GPS 좌표를 폴리라인 선분에 스냅하고 방향 각도를 계산
 */
export function snapToPolyline(
  P: [number, number],
  polyline: [number, number][]
): {
  position: [number, number];
  angle: number;
  segment: { A: [number, number]; B: [number, number] };
} {
  if (polyline.length < 2)
    return {
      position: polyline[0],
      angle: 0,
      segment: { A: polyline[0], B: polyline[0] },
    };

  let bestDist = Infinity;
  let bestPosition: [number, number] = polyline[0];
  let bestSegment = { A: polyline[0], B: polyline[1] };

  for (let i = 0; i < polyline.length - 1; i++) {
    const A = polyline[i];
    const B = polyline[i + 1];
    const projection = projectPointOnSegment(P, A, B);
    const d = distance(P, projection);
    if (d < bestDist) {
      bestDist = d;
      bestPosition = projection;
      bestSegment = { A, B };
    }
  }

  const angle = calculateBearing(bestSegment.A, bestSegment.B);

  return {
    position: bestPosition,
    angle,
    segment: bestSegment,
  };
}
