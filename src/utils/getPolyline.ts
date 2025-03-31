// src/utils/getPolyline.ts

export type GeoFeature = {
  type: "Feature";
  properties: { linkId: number; linkOrd: number; updnDir: string };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type GeoPolylineData = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

// 캐시용 객체
const cache: Record<string, GeoPolylineData> = {};
const pending: Record<string, Promise<GeoPolylineData>> = {};

/**
 * /polylines/{routeName}.geojson 파일을 fetch하여 캐싱합니다.
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
  pending[routeName] = fetch(`/polylines/${routeName}.geojson`)
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
    // GeoJSON 좌표는 [lng, lat] 순서이므로 [lat, lng]로 변환
    const coords = feature.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

    if (feature.properties.updnDir === "1") {
      upPolyline.push(coords);
    } else if (feature.properties.updnDir === "0") {
      downPolyline.push(coords);
    }
  });

  return { upPolyline, downPolyline };
}
