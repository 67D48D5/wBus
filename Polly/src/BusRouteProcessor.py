# BusRouteProcessor.py

import os
import json
import requests
import time
import argparse

from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load `.env` file from the `Polly` project root
project_root = Path(__file__).resolve().parent.parent
load_dotenv(project_root / ".env")


class BusRouteProcessor:
    def __init__(self, city_code, output_base_dir="./output", specific_route=None):
        """Initialize the integrated bus processor.

        Args:
            city_code: The city code to process
            output_base_dir: Base directory for output files
            specific_route: Optional route number to process only that route
        """
        self.service_key = os.getenv("DATA_GO_KR_SERVICE_KEY")
        self.tago_url = os.getenv(
            "TAGO_API_URL",
            "http://apis.data.go.kr/1613000/BusRouteInfoInqireService",
        )
        self.osrm_url = os.getenv(
            "OSRM_ROUTE_API_URL", "http://router.project-osrm.org/route/v1/driving"
        )

        if not self.service_key:
            raise ValueError(
                "Environment variable 'DATA_GO_KR_SERVICE_KEY' is not set. Please check your `.env` file."
            )

        self.city_code = city_code
        self.specific_route = specific_route
        self.output_base_dir = Path(output_base_dir)
        self.raw_routes_dir = self.output_base_dir / "raw_routes"
        self.snapped_routes_dir = self.output_base_dir / "snapped_routes"
        self.mapping_file = self.output_base_dir / "routeMap.json"

        # Data holders
        self.all_stops = {}  # Station Master
        self.route_details = {}  # Route Details

        # Create directories
        self.raw_routes_dir.mkdir(parents=True, exist_ok=True)
        self.snapped_routes_dir.mkdir(parents=True, exist_ok=True)

    def _call_api(self, endpoint, params):
        """Call the TAGO API with the given endpoint and parameters."""
        params.update({"serviceKey": self.service_key, "_type": "json"})
        try:
            response = requests.get(
                f"{self.tago_url}/{endpoint}", params=params, timeout=10
            )
            response.raise_for_status()
            data = response.json()

            # Validate response structure
            if isinstance(data, str):
                print(
                    f"    [TAGO API Error] Unexpected response type (string): {data[:200]}"
                )
                return None
            if not isinstance(data, dict):
                print(f"    [TAGO API Error] Unexpected response type: {type(data)}")
                return None

            return data
        except requests.exceptions.RequestException as e:
            print(f"    [TAGO API Error] Request failed: {e}")
            return None
        except ValueError as e:
            print(f"    [TAGO API Error] Invalid JSON response: {e}")
            return None
        except Exception as e:
            print(f"    [TAGO API Error] {e}")
            return None

    # ==================== Phase 1: Data Collection ====================

    def get_all_routes(self):
        """Fetch all route IDs, generate mapping file, and return route list."""
        print("\n[Phase 1: Data Collection & Mapping]")
        print("Fetching all routes from the city...")

        params = {"cityCode": self.city_code, "numOfRows": 2000, "pageNo": 1}
        data = self._call_api("getRouteNoList", params)

        if not data:
            print("  ✗ No data returned from API.")
            return []

        try:
            if "response" not in data:
                print(
                    f"  ✗ Invalid response structure. Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}"
                )
                return []

            response = data["response"]
            if "body" not in response or "items" not in response["body"]:
                print("  ✗ Unexpected API response structure.")
                return []

            items = response["body"]["items"].get("item", [])
            routes = items if isinstance(items, list) else [items] if items else []

            if not routes:
                print("  ✗ No routes found.")
                return []

            print(f"  ✓ Found {len(routes)} routes.")

            # Generate route mapping
            try:
                route_mapping = {}
                for item in routes:
                    no = str(item["routeno"])
                    rid = str(item["routeid"])

                    if no not in route_mapping:
                        route_mapping[no] = []

                    if rid not in route_mapping[no]:
                        route_mapping[no].append(rid)

                sorted_routes = dict(sorted(route_mapping.items(), key=lambda x: x[0]))

                final_json = {}
                if self.mapping_file.exists():
                    try:
                        with open(self.mapping_file, "r", encoding="utf-8") as f:
                            final_json = json.load(f)
                    except Exception:
                        pass

                final_json["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
                final_json["route_numbers"] = sorted_routes

                with open(self.mapping_file, "w", encoding="utf-8") as f:
                    json.dump(final_json, f, ensure_ascii=False, indent=2)
                print(f"  ✓ Route mapping saved to {self.mapping_file}")
            except Exception as e:
                print(f"  ✗ Failed to save route mapping: {e}")

            return routes
        except (KeyError, TypeError) as e:
            print(f"  ✗ Error parsing API response: {e}")
            print(f"  Response: {str(data)[:500]}")
            return []

    def save_route_geojson(self, route_id, route_no, save_file=True):
        """Fetch station list for a route and save as GeoJSON."""
        params = {
            "cityCode": self.city_code,
            "routeId": route_id,
            "numOfRows": 500,
        }
        data = self._call_api("getRouteAcctoThrghSttnList", params)

        if not data:
            print(f"    ✗ No data returned for route {route_no}")
            return None

        try:
            if (
                "response" not in data
                or "body" not in data["response"]
                or "items" not in data["response"]["body"]
            ):
                print(f"    ✗ No stations found for route {route_no}")
                return None

            items = data["response"]["body"]["items"].get("item", [])
            if not items:
                print(f"    ✗ No stations found for route {route_no}")
                return None

            if isinstance(items, dict):
                items = [items]

            # Sort by node order
            items.sort(key=lambda x: int(x["nodeord"]))

            # Prepare route details
            current_sequence = []

            for item in items:
                nid = str(item.get("nodeid"))
                if not nid:
                    continue

                # Update master stop list
                if nid not in self.all_stops:
                    try:
                        self.all_stops[nid] = {
                            "nodenm": item.get("nodenm"),
                            "nodeno": int(item.get("nodeno", 0)),
                            "gpslati": float(item.get("gpslati")),
                            "gpslong": float(item.get("gpslong")),
                        }
                    except (ValueError, TypeError):
                        pass

                # Add to current route sequence
                try:
                    current_sequence.append(
                        {
                            "nodeid": nid,
                            "nodeord": int(item.get("nodeord")),
                            "updowncd": int(item.get("updowncd", 0)),
                        }
                    )
                except (ValueError, TypeError):
                    continue

            self.route_details[route_id] = {
                "routeno": str(route_no),
                "sequence": current_sequence,
            }

            if not save_file:
                return None

            # Sort by node order and separate by direction
            items.sort(key=lambda x: int(x["nodeord"]))

            up_coords = [
                [float(i["gpslong"]), float(i["gpslati"])]
                for i in items
                if str(i["updowncd"]) == "1"
            ]
            down_coords = [
                [float(i["gpslong"]), float(i["gpslati"])]
                for i in items
                if str(i["updowncd"]) == "0"
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

            if not features:
                print(f"    ✗ No coordinates found for route {route_no}")
                return None

            geojson = {"type": "FeatureCollection", "features": features}

            file_path = self.raw_routes_dir / f"{route_no}_{route_id}.geojson"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(geojson, f, ensure_ascii=False)

            return file_path
        except (KeyError, TypeError, ValueError) as e:
            print(f"    ✗ Error processing route {route_no}: {e}")
            return None

    def save_route_map_json(self, routes_list):
        """Save collected bus stop information to routeMap.json."""
        if not self.all_stops:
            return

        # Load existing data to merge if available
        route_mapping = {}
        for r in routes_list:
            no = str(r["routeno"])
            rid = str(r["routeid"])
            if no not in route_mapping:
                route_mapping[no] = []
            if rid not in route_mapping[no]:
                route_mapping[no].append(rid)

        final_data = {
            "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "route_numbers": dict(sorted(route_mapping.items())),
            "route_details": self.route_details,
            "stations": dict(sorted(self.all_stops.items())),
        }

        try:
            with open(self.mapping_file, "w", encoding="utf-8") as f:
                json.dump(final_data, f, ensure_ascii=False, indent=2)

            print(f"  ✓ Total Stations: {len(self.all_stops)}")
            print(f"  ✓ Total Routes: {len(self.route_details)}")
            print(f"  ✓ Station mapping saved to {self.mapping_file}")
        except Exception as e:
            print(f"  ✗ Failed to save station mapping: {e}")

    def collect_all_routes(self, save_files=True):
        """Collect all routes or specific route and save as GeoJSON files."""
        routes = self.get_all_routes()

        # Filter for specific route if provided
        if self.specific_route:
            routes = [
                r for r in routes if str(r["routeno"]) == str(self.specific_route)
            ]
            if not routes:
                print(f"  ✗ Route {self.specific_route} not found.")
                return

        msg = "  Collecting" if save_files else "  Scanning"
        suffix = " as GeoJSON..." if save_files else " for stations..."

        print(f"{msg} {len(routes)} route(s){suffix}")

        for i, route in enumerate(routes):
            route_id = route["routeid"]
            route_no = route["routeno"]
            print(f"  [{i+1}/{len(routes)}] Processing route {route_no}...")
            self.save_route_geojson(route_id, route_no, save_file=save_files)
            time.sleep(0.3)  # Rate limiting

        self.save_route_map_json(routes)
        print(f"  ✓ Routes collected in {self.raw_routes_dir}")

    # ==================== Phase 2: Route Snapping ====================

    def _get_route_from_osrm(self, coords):
        """Call OSRM Route API to get the snapped route."""
        if len(coords) < 2:
            return coords

        coord_str = ";".join([f"{c[0]:.6f},{c[1]:.6f}" for c in coords])

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
                return data["routes"][0]["geometry"]["coordinates"]
            else:
                print(
                    f"      [OSRM Fail] {data.get('code')}: {data.get('message', '')}"
                )
                return coords
        except Exception as e:
            print(f"      [Error] OSRM API call failed: {e}")
            return coords

    def process_route_safely(self, coords):
        """Process coordinates in chunks to avoid URL length limits."""
        chunk_size = 40
        final_coords = []

        for i in range(0, len(coords), chunk_size - 1):
            chunk = coords[i : i + chunk_size]
            if len(chunk) < 2:
                break

            print(f"    - Processing chunk ({i}~{i+len(chunk)})")
            snapped = self._get_route_from_osrm(chunk)

            if final_coords:
                final_coords.extend(snapped[1:])
            else:
                final_coords.extend(snapped)

            time.sleep(1.0)  # Rate limiting

        return final_coords

    def snap_all_routes(self):
        """Snap all collected routes or specific route through OSRM."""
        print("\n[Phase 2: Route Snapping via OSRM]")
        files = list(self.raw_routes_dir.glob("*.geojson"))

        # Filter for specific route if provided
        if self.specific_route:
            files = [f for f in files if str(self.specific_route) in f.stem]
            if not files:
                print(f"  ✗ No processed files found for route {self.specific_route}.")
                return

        print(f"Processing {len(files)} route file(s)...")

        for file_path in files:
            print(f"\n  Processing {file_path.name}...")

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

                output_path = self.snapped_routes_dir / file_path.name

                # Merge with existing data if present
                if output_path.exists():
                    with open(output_path, "r", encoding="utf-8") as f:
                        existing_data = json.load(f)
                        existing_data["features"].extend(new_features)
                        final_data = existing_data
                else:
                    final_data = {
                        "type": "FeatureCollection",
                        "features": new_features,
                    }

                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(final_data, f, ensure_ascii=False)

                print(f"    ✓ Saved {output_path.name}")
            except Exception as e:
                print(f"    [Error] Failed to process {file_path.name}: {e}")

        print(f"\n✓ All routes snapped and saved in {self.snapped_routes_dir}")

    # ==================== Main Execution ====================

    def run_full_pipeline(self, station_map_only=False):
        """Execute the complete pipeline: collect -> snap -> map."""
        print("=" * 60)
        print("Starting Integrated Bus Processing Pipeline")
        print(f"City Code: {self.city_code}")
        if self.specific_route:
            print(f"Processing Route: {self.specific_route}")
        print(f"Output Base Directory: {self.output_base_dir}")
        print("=" * 60)

        try:
            # Phase 1: Collect all routes
            self.collect_all_routes(save_files=not station_map_only)

            if station_map_only:
                print("\n" + "=" * 60)
                print("✓ Station map generation completed!")
                print("=" * 60)
                return

            # Phase 2: Snap routes through OSRM
            self.snap_all_routes()

            print("\n" + "=" * 60)
            print("✓ Pipeline completed successfully!")
            print("=" * 60)

        except Exception as e:
            print(f"\n✗ Pipeline failed: {e}")
            raise


# ==================== Main Execution Block ====================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Process bus routes with OSRM snapping and mapping"
    )
    parser.add_argument(
        "--route",
        type=str,
        default=None,
        help="Specific route number to process (e.g., '30', '34'). If not provided, all routes are processed.",
    )
    parser.add_argument(
        "--city-code",
        type=str,
        default="32020",
        help="City code (default: 32020 for Wonju)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output base directory. If not provided, uses storage/processed_routes",
    )
    parser.add_argument(
        "--stationMap",
        action="store_true",
        help="Only update station data in routeMap.json and skip route snapping",
    )

    args = parser.parse_args()

    try:
        # Configuration
        CITY_CODE = args.city_code
        OUTPUT_BASE_DIR = (
            Path(args.output_dir)
            if args.output_dir
            else project_root / "storage" / "processed_routes"
        )

        # Initialize and run the processor
        processor = BusRouteProcessor(
            CITY_CODE, OUTPUT_BASE_DIR, specific_route=args.route
        )
        processor.run_full_pipeline(station_map_only=args.stationMap)

    except ValueError as e:
        print(f"Configuration error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
