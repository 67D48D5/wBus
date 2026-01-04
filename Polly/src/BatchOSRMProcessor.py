# BatchOSRMProcessor.py

import os
import json
import requests
import time
from pathlib import Path


class BatchOSRMProcessor:
    def __init__(self, input_dir, output_dir):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.osrm_url = "http://router.project-osrm.org/route/v1/driving"

        if not self.output_dir.exists():
            self.output_dir.mkdir(parents=True)

    def _get_route(self, coords):
        """좌표들을 순서대로 연결하는 Route API 호출"""
        if len(coords) < 2:
            return coords

        # 좌표 문자열 생성 (경도,위도 순서)
        coord_str = ";".join([f"{c[0]:.6f},{c[1]:.6f}" for c in coords])

        # Route API는 Match와 파라미터가 다릅니다.
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "false",
            "alternatives": "false",
        }

        try:
            url = f"{self.osrm_url}/{coord_str}"
            res = requests.get(url, params=params, timeout=15)

            if res.status_code != 200:
                print(f"      [OSRM HTTP Error] {res.status_code}")
                return coords

            data = res.json()
            if data.get("code") == "Ok":
                # Route API는 'routes' 필드를 반환합니다.
                return data["routes"][0]["geometry"]["coordinates"]
            else:
                print(
                    f"      [OSRM Fail] {data.get('code')}: {data.get('message', '')}"
                )
                return coords
        except Exception as e:
            print(f"      [Error] API 호출 실패: {e}")
            return coords

    def process_route_safely(self, coords):
        """좌표가 너무 많으면 URL 제한에 걸리므로 청크로 나누어 처리"""
        # Route API는 Match보다 더 넓은 범위를 커버하므로 청크를 50 정도로 키워도 됩니다.
        chunk_size = 40
        final_coords = []

        for i in range(0, len(coords), chunk_size - 1):
            chunk = coords[i : i + chunk_size]
            if len(chunk) < 2:
                break

            print(f"    - 구간 처리 중... ({i}~{i+len(chunk)})")
            snapped = self._get_route(chunk)

            if final_coords:
                final_coords.extend(snapped[1:])
            else:
                final_coords.extend(snapped)

            time.sleep(1.0)  # 데모 서버 예우 (차단 방지)

        return final_coords

    def process_all(self):
        files = list(self.input_dir.glob("*.geojson"))
        print(f"총 {len(files)}개의 파일을 발견했습니다.")

        for file_path in files:
            route_no = file_path.stem.split("_")[0]
            print(f"\n[작업 시작] {file_path.name} -> {file_path.name}")

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    geojson_data = json.load(f)

                new_features = []
                for feature in geojson_data.get("features", []):
                    raw_coords = feature["geometry"]["coordinates"]
                    snapped_coords = self.process_route_safely(raw_coords)

                    properties = feature.get("properties", {})
                    new_features.append(
                        {
                            "type": "Feature",
                            "properties": properties,
                            "geometry": {
                                "type": "LineString",
                                "coordinates": snapped_coords,
                            },
                        }
                    )

                output_path = self.output_dir / f"{file_path.name}"

                # 병합 로직
                if output_path.exists():
                    with open(output_path, "r", encoding="utf-8") as f:
                        existing_data = json.load(f)
                        existing_data["features"].extend(new_features)
                        final_data = existing_data
                else:
                    final_data = {"type": "FeatureCollection", "features": new_features}

                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(final_data, f, ensure_ascii=False)

                print(f"[완료] {output_path.name} 저장됨")
            except Exception as e:
                print(f"[파일 처리 실패] {file_path.name}: {e}")


# Execution Part
INPUT_FOLDER = "../storage/station_loc_data"
OUTPUT_FOLDER = "../storage/snapped_polyline_data"

processor = BatchOSRMProcessor(INPUT_FOLDER, OUTPUT_FOLDER)
processor.process_all()
