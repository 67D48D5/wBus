# BusDataCollector.py

import requests
import json
import os
import time


class BusDataCollector:
    def __init__(self, service_key):
        self.service_key = service_key
        self.base_url = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService"

    def _call_api(self, endpoint, params):
        params.update({"serviceKey": self.service_key, "_type": "json"})
        try:
            response = requests.get(
                f"{self.base_url}/{endpoint}", params=params, timeout=10
            )
            return response.json()
        except Exception as e:
            print(f"API 호출 오류: {e}")
            return None

    def get_all_routes(self, city_code):
        """도시의 모든 노선 ID와 번호를 가져옵니다[cite: 23]."""
        params = {"cityCode": city_code, "numOfRows": 1000, "pageNo": 1}
        data = self._call_api("getRouteNoList", params)

        if not data or "item" not in data["response"]["body"]["items"]:
            return []

        items = data["response"]["body"]["items"]["item"]
        return items if isinstance(items, list) else [items]

    def save_route_geojson(self, city_code, route_id, route_no, output_dir):
        """특정 노선의 선형을 추출하여 GeoJSON으로 저장합니다[cite: 34]."""
        params = {"cityCode": city_code, "routeId": route_id, "numOfRows": 500}
        data = self._call_api("getRouteAcctoThrghSttnList", params)

        if not data or "item" not in data["response"]["body"]["items"]:
            return

        items = data["response"]["body"]["items"]["item"]
        if isinstance(items, dict):
            items = [items]

        # 정류소 순번(nodeord) 정렬 및 상하행 분류
        items.sort(key=lambda x: int(x["nodeord"]))

        up_coords = [
            [float(i["gpslong"]), float(i["gpslati"])]
            for i in items
            if str(i["updowncd"]) == "0"
        ]
        down_coords = [
            [float(i["gpslong"]), float(i["gpslati"])]
            for i in items
            if str(i["updowncd"]) == "1"
        ]

        features = []
        if up_coords:
            features.append(
                {
                    "type": "Feature",
                    "properties": {"dir": "up"},
                    "geometry": {"type": "LineString", "coordinates": up_coords},
                }
            )
        if down_coords:
            features.append(
                {
                    "type": "Feature",
                    "properties": {"dir": "down"},
                    "geometry": {"type": "LineString", "coordinates": down_coords},
                }
            )

        geojson = {"type": "FeatureCollection", "features": features}

        file_path = os.path.join(output_dir, f"{route_no}_{route_id}.geojson")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)


# 사용 예시
SERVICE_KEY = "CAT_IS_CUTE"
CITY_CODE = "32020"  # 원주시 코드 (필요시 getCtyCodeList로 확인 [cite: 56])
OUTPUT_DIR = "./wonju_bus_routes"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

collector = BusDataCollector(SERVICE_KEY)
print(f"도시코드 {CITY_CODE}의 노선 목록을 가져오는 중...")

routes = collector.get_all_routes(CITY_CODE)
print(f"총 {len(routes)}개의 노선을 발견했습니다.")

for i, route in enumerate(routes):
    rid, rno = route["routeid"], route["routeno"]
    print(f"[{i+1}/{len(routes)}] 가공 중: {rno}번 ({rid})")
    collector.save_route_geojson(CITY_CODE, rid, rno, OUTPUT_DIR)
    time.sleep(3)  # 서버 부하 방지용 짧은 딜레이

print("모든 노선 데이터 수집 완료!")
