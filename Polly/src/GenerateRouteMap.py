# GenerateRouteMap.py

import requests
import json
from datetime import datetime


def generate_route_mapping(service_key, city_code):
    # 1. API 호출 설정
    url = "http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList"
    params = {
        "serviceKey": service_key,
        "cityCode": city_code,
        "numOfRows": 2000,  # 한 번에 모든 노선을 가져오기 위해 충분히 크게 설정
        "pageNo": 1,
        "_type": "json",
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if data["response"]["header"]["resultCode"] != "00":
            print(f"API 오류: {data['response']['header']['resultMsg']}")
            return None

        items = data["response"]["body"]["items"]["item"]
        if isinstance(items, dict):  # 결과가 1개일 경우 처리 [cite: 33]
            items = [items]

        # 2. 데이터 구조화 (routeno 기준 그룹화)
        route_mapping = {}
        for item in items:
            no = str(item["routeno"])
            rid = str(item["routeid"])

            if no not in route_mapping:
                route_mapping[no] = []

            # 중복 ID 방지
            if rid not in route_mapping[no]:
                route_mapping[no].append(rid)

        # 3. 최종 JSON 구조 생성
        # 번호 순으로 정렬 (Optional)
        sorted_routes = dict(sorted(route_mapping.items(), key=lambda x: x[0]))

        final_json = {
            "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
            "routes": sorted_routes,
        }

        # 셔틀버스 등 API에 없는 고정 데이터는 여기서 수동 병합 가능
        final_json["routes"]["Shuttle"] = []

        return final_json

    except Exception as e:
        print(f"예외 발생: {e}")
        return None


# --- 실행 ---
MY_KEY = "CAT_IS_CUTE"
CITY_CODE = "32020"  # 원주시

mapping_data = generate_route_mapping(MY_KEY, CITY_CODE)

if mapping_data:
    with open("route_mapping.json", "w", encoding="utf-8") as f:
        json.dump(mapping_data, f, ensure_ascii=False, indent=2)
    print("route_mapping.json 생성이 완료되었습니다.")
