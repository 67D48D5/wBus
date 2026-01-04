# BusRouteProcessor.py

import requests
import json
import time


class BusRouteProcessor:
    def __init__(self, service_key):
        self.service_key = service_key
        self.tago_url = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList"
        self.osrm_url = "http://router.project-osrm.org/match/v1/driving"

    def fetch_stations(self, city_code, route_id):
        """국토부 API에서 정류소 목록을 가져옵니다."""
        params = {
            "serviceKey": self.service_key,
            "cityCode": city_code,
            "routeId": route_id,
            "numOfRows": 500,
            "_type": "json",  # [cite: 19, 27]
        }
        try:
            res = requests.get(self.tago_url, params=params)
            items = res.json()["response"]["body"]["items"]["item"]
            return items if isinstance(items, list) else [items]
        except:
            return []

    def snap_to_roads(self, coords):
        """OSRM Match API를 이용해 도로에 선을 붙입니다."""
        if len(coords) < 2:
            return coords

        # OSRM 제한을 고려하여 80개씩 분할 (연결성을 위해 1개씩 중첩)
        chunk_size = 80
        all_snapped_coords = []

        for i in range(0, len(coords), chunk_size - 1):
            chunk = coords[i : i + chunk_size]
            if len(chunk) < 2:
                break

            coord_str = ";".join([f"{c[0]},{c[1]}" for c in chunk])
            # overview=full: 상세 좌표 반환, geometries=geojson: GeoJSON 포맷
            url = f"{self.osrm_url}/{coord_str}?overview=full&geometries=geojson"

            try:
                res = requests.get(url)
                data = res.json()
                if data.get("code") == "Ok":
                    # 매칭된 선형 좌표 추출
                    snapped = data["matchings"][0]["geometry"]["coordinates"]
                    # 중복 점 제거하며 합치기
                    if all_snapped_coords:
                        all_snapped_coords.extend(snapped[1:])
                    else:
                        all_snapped_coords.extend(snapped)
                time.sleep(0.2)  # 데모 서버 예절
            except Exception as e:
                print(f"OSRM Error: {e}")

        return all_snapped_coords

    def process_route(self, city_code, route_id, route_no):
        """전체 프로세스 실행"""
        stations = self.fetch_stations(city_code, route_id)
        if not stations:
            return

        # nodeord 순 정렬
        stations.sort(key=lambda x: int(x["nodeord"]))

        # 상하행 분류 [cite: 41, 42]
        up_raw = [
            [float(s["gpslong"]), float(s["gpslati"])]
            for s in stations
            if str(s["updowncd"]) == "0"
        ]
        down_raw = [
            [float(s["gpslong"]), float(s["gpslati"])]
            for s in stations
            if str(s["updowncd"]) == "1"
        ]

        # 도로 보정 실행
        print(f"매칭 중: {route_no} ({route_id})")
        up_snapped = self.snap_to_roads(up_raw)
        down_snapped = self.snap_to_roads(down_raw)

        # GeoJSON 생성
        features = []
        if up_snapped:
            features.append(
                {
                    "type": "Feature",
                    "properties": {"updnDir": "1"},
                    "geometry": {"type": "LineString", "coordinates": up_snapped},
                }
            )
        if down_snapped:
            features.append(
                {
                    "type": "Feature",
                    "properties": {"updnDir": "0"},
                    "geometry": {"type": "LineString", "coordinates": down_snapped},
                }
            )

        return {"type": "FeatureCollection", "features": features}


# 실행부
PROCESSOR = BusRouteProcessor("CAT_IS_CUTE")
final_geojson = PROCESSOR.process_route("32020", "WJB251000384", "30")  # 30번 버스 예시

with open("route_30_snapped.geojson", "w", encoding="utf-8") as f:
    json.dump(final_geojson, f, ensure_ascii=False)
