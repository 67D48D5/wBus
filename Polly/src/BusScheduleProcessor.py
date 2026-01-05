# BusScheduleProcessor.py

import json
import requests
import time
import re

from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from datetime import datetime
from collections import defaultdict


class BusScheduleProcessor:
    """
    Crawler for bus schedules from Wonju City Transit Information Center.
    Fetches schedule data from http://its.wonju.go.kr/bus/bus04.do
    """

    def __init__(self, output_dir="./storage", specific_route=None):
        """
        Initialize the bus schedule processor.

        Args:
            output_dir: Directory to save schedule data
            specific_route: Optional specific route number to filter (e.g., "30", "34-1")
        """
        self.base_url = "http://its.wonju.go.kr/bus/bus04.do"
        self.detail_url = "http://its.wonju.go.kr/bus/bus04Detail.do"
        self.output_dir = Path(output_dir)
        self.schedules_dir = self.output_dir / "schedules"
        self.specific_route = specific_route

        # Create directories
        self.schedules_dir.mkdir(parents=True, exist_ok=True)

    def normalize_day_type(self, day_type: str) -> str:
        """
        Normalize day type labels from the source site to the keys used by the
        frontend JSON (general/weekday/weekend).
        """
        if not day_type:
            return "general"

        lower = day_type.lower()

        # Map common Korean labels to the canonical keys
        if "평일" in lower or "주중" in lower:
            return "weekday"
        if (
            "주말" in lower
            or "휴일" in lower
            or "토" in lower
            or "일" in lower
            or "공휴" in lower
        ):
            return "weekend"
        if "방학" in lower:
            # 방학 일정은 주말/휴일 패턴과 동일하게 취급
            return "weekend"

        return "general"

    def fetch_schedule_page(self) -> Optional[str]:
        """
        Fetch the schedule page HTML.

        Returns:
            HTML content or None if failed
        """
        try:
            print(f"Fetching schedule page from {self.base_url}...")
            response = requests.get(self.base_url, timeout=30)
            response.encoding = "utf-8"

            if response.status_code == 200:
                print("✓ Successfully fetched schedule page")
                return response.text
            else:
                print(f"✗ Failed to fetch page. Status code: {response.status_code}")
                return None

        except Exception as e:
            print(f"✗ Error fetching schedule page: {e}")
            return None

    def extract_route_info_from_main(self, html: str) -> Dict[str, Dict]:
        """
        Extract route basic info from main schedule page.

        Returns:
            Dictionary with route info
        """
        soup = BeautifulSoup(html, "html.parser")
        route_info = {}

        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")

            for row in rows:
                cols = row.find_all("td")

                if len(cols) >= 6:
                    try:
                        route_cell = cols[0]
                        route_text = route_cell.get_text(strip=True)

                        # Extract onclick value
                        onclick = route_cell.get("onclick", "")
                        route_match = re.search(r"goDetail\('([^']+)'\)", onclick)

                        if route_match:
                            route_id = route_match.group(1)

                            # Parse route number
                            number_match = re.match(r"^(\S+?)(\(.*\))?$", route_id)
                            if number_match:
                                route_number = number_match.group(1)
                            else:
                                route_number = route_id.split("(")[0]

                            origin = cols[1].get_text(strip=True)
                            destination = cols[2].get_text(strip=True)

                            if route_number not in route_info:
                                route_info[route_number] = {
                                    "origin": origin,
                                    "destination": destination,
                                    "directions": set(),
                                }

                            route_info[route_number]["directions"].add(origin)
                            route_info[route_number]["directions"].add(destination)

                    except Exception as e:
                        continue

        # Convert sets to sorted lists
        for route_number in route_info:
            route_info[route_number]["directions"] = sorted(
                list(route_info[route_number]["directions"])
            )

        return route_info

    def extract_route_links(self, html: str) -> List[str]:
        """
        Extract route identifiers from goDetail() onclick handlers.

        Args:
            html: HTML content of the schedule page

        Returns:
            List of route identifiers (e.g., "30", "34-1(평일)")
        """
        route_ids = []

        # Find all goDetail calls
        pattern = r"goDetail\('([^']+)'\)"
        matches = re.findall(pattern, html)

        for match in matches:
            route_ids.append(match)

        return route_ids

    def fetch_detail_page(self, route_id: str) -> Optional[str]:
        """
        Fetch the detail schedule page for a specific route.

        Args:
            route_id: Route identifier (e.g., "30", "34-1(평일)")

        Returns:
            HTML content or None if failed
        """
        try:
            params = {"no": route_id}
            response = requests.post(self.detail_url, params=params, timeout=30)
            response.encoding = "utf-8"

            if response.status_code == 200:
                return response.text
            else:
                print(
                    f"  ✗ Failed to fetch detail for {route_id}. Status: {response.status_code}"
                )
                return None

        except Exception as e:
            print(f"  ✗ Error fetching detail for {route_id}: {e}")
            return None

    def parse_detail_schedule(
        self, html: str, route_id: str, route_meta: Optional[Dict] = None
    ) -> Dict:
        """
        Parse detailed schedule times from detail page.

        Args:
            html: HTML content of the detail page
            route_id: Route identifier
            route_meta: Optional route metadata (origin/destination/directions)

        Returns:
            Dictionary with route schedule details including times by direction
        """
        soup = BeautifulSoup(html, "html.parser")

        # Parse route number and day type
        route_match = re.match(r"^(\S+?)(\(.*\))?$", route_id)
        if route_match:
            route_number = route_match.group(1)
            raw_day_type = (
                route_match.group(2).strip("()") if route_match.group(2) else "general"
            )
        else:
            route_number = route_id
            raw_day_type = "general"

        day_type = self.normalize_day_type(raw_day_type)

        # Extract directions from table headers
        directions: List[str] = []
        route_meta_directions = route_meta.get("directions", []) if route_meta else []
        notes_column_idx = -1  # Track 비고 column index

        tables = soup.find_all("table")

        # Pick the schedule table by looking for direction-style headers containing "발"
        schedule_table = None
        for table in tables:
            header_texts = [th.get_text(strip=True) for th in table.find_all("th")]
            if any("발" in text for text in header_texts):
                schedule_table = table
                break

        # Fallback to the first table if nothing matched
        if not schedule_table and tables:
            schedule_table = tables[0]

        direction_map: Dict[int, str] = {}

        if schedule_table:
            header_rows = schedule_table.find_all("tr")
            for row in header_rows:
                ths = row.find_all("th")
                if not ths:
                    continue

                for idx, th in enumerate(ths):
                    text = th.get_text(strip=True)

                    if text == "비고":
                        notes_column_idx = idx
                        continue

                    dir_text = text[:-1] if text.endswith("발") else text

                    # Filter out non-direction headers like 운행순번, 시, 분
                    if (
                        dir_text
                        and dir_text not in ["운행순번", "비고", "시", "분", ""]
                        and not re.match(r"^\d+시$", dir_text)
                    ):
                        if dir_text not in directions:
                            directions.append(dir_text)
                        direction_map[idx] = dir_text

        schedule_data = {
            "routeNumber": route_number,
            "routeId": route_id,
            "dayType": day_type,
            "directions": directions,
            "departureTimes": [],  # Raw times for debugging
            "timesByDirection": {},  # Organized by direction
            "notes": {},  # Notes from 비고 column
        }

        # Parse times from tables by direction
        parsed_entries: List[Dict] = []
        note_id_counter = 1
        notes_map = {}  # Map note text to note ID

        # Only parse rows from the chosen schedule table to keep column alignment
        tables_to_parse = [schedule_table] if schedule_table else tables

        for table in tables_to_parse:
            rows = table.find_all("tr")

            # Skip header rows
            data_rows = [r for r in rows if r.find_all("td")]

            for row in data_rows:
                cols = row.find_all("td")

                # Extract note from 비고 column if present
                note_id = None
                if notes_column_idx >= 0 and notes_column_idx < len(cols):
                    note_text = cols[notes_column_idx].get_text(strip=True)
                    if note_text:
                        if note_text not in notes_map:
                            notes_map[note_text] = str(note_id_counter)
                            schedule_data["notes"][str(note_id_counter)] = note_text
                            note_id_counter += 1
                        note_id = notes_map[note_text]

                # Map times to directions based on column indices
                for col_idx, col in enumerate(cols):
                    text = col.get_text(strip=True)
                    # Match time format (HH:MM or H:MM, optionally ending with 발)
                    time_match = re.match(r"^(\d{1,2}:\d{2})발?$", text)
                    if time_match:
                        # Extract just the time part, removing 발 if present
                        clean_time = time_match.group(1)
                        schedule_data["departureTimes"].append(clean_time)
                        parsed_entries.append(
                            {"col_idx": col_idx, "time": clean_time, "noteId": note_id}
                        )

        # Fallback to route meta directions if we failed to detect from headers
        if not directions and route_meta_directions:
            directions = route_meta_directions

        # If no direction mapping was found in headers, infer it from time columns
        if not direction_map:
            time_columns = sorted({entry["col_idx"] for entry in parsed_entries})
            target_directions = directions or route_meta_directions
            if not target_directions:
                target_directions = [
                    f"Direction {i + 1}" for i in range(len(time_columns))
                ]

            direction_map = {
                col_idx: target_directions[idx]
                for idx, col_idx in enumerate(time_columns)
                if idx < len(target_directions)
            }

            # Preserve direction ordering based on the mapped columns
            directions = [
                direction_map[col_idx]
                for col_idx in time_columns
                if col_idx in direction_map
            ]
        else:
            # Align directions to the header order used in the direction map
            ordered_dirs: List[str] = []
            for col_idx in sorted(direction_map.keys()):
                dir_name = direction_map[col_idx]
                if dir_name not in ordered_dirs:
                    ordered_dirs.append(dir_name)
            if ordered_dirs:
                directions = ordered_dirs

        times_by_direction = {direction: [] for direction in directions}

        for entry in parsed_entries:
            dir_name = direction_map.get(entry["col_idx"])
            if not dir_name:
                continue

            time_entry = {"time": entry["time"]}
            if entry["noteId"]:
                time_entry["noteId"] = entry["noteId"]

            if dir_name not in times_by_direction:
                times_by_direction[dir_name] = []
            times_by_direction[dir_name].append(time_entry)

        schedule_data["directions"] = directions
        schedule_data["timesByDirection"] = times_by_direction

        return schedule_data

    def organize_times_by_hour(self, times: List) -> Dict[str, List[Dict]]:
        """
        Organize departure times by hour.

        Args:
            times: List of time entries (either strings or dicts with time and noteId)

        Returns:
            Dictionary organized by hour
        """
        organized = defaultdict(list)

        for time_entry in times:
            try:
                # Handle both string times and dict entries
                if isinstance(time_entry, str):
                    time_str = time_entry
                    note_id = None
                else:
                    time_str = time_entry.get("time", "")
                    note_id = time_entry.get("noteId")

                if not time_str:
                    continue

                hour, minute = time_str.split(":")
                hour = hour.zfill(2)
                minute = minute.zfill(2)

                minute_entry = {"minute": minute}
                if note_id:
                    minute_entry["noteId"] = note_id

                organized[hour].append(minute_entry)

            except Exception as e:
                continue

        return dict(organized)

    def merge_schedules(
        self, schedules: List[Dict], route_info: Dict
    ) -> Dict[str, Dict]:
        """
        Merge multiple day-type schedules into final format.

        Args:
            schedules: List of schedule dictionaries from different day types
            route_info: Route information from main page

        Returns:
            Dictionary organized by route number in final format
        """
        routes = {}

        for schedule in schedules:
            route_number = schedule["routeNumber"]

            if route_number not in routes:
                # Initialize route structure
                info = route_info.get(route_number, {})
                routes[route_number] = {
                    "routeId": route_number,
                    "routeName": f"{route_number}번",
                    "description": f"{info.get('origin', '')} ↔ {info.get('destination', '')}",
                    "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
                    "directions": info.get("directions", []),
                    "routeDetails": [],
                    "featuredStops": {"general": []},
                    "schedule": {},
                    "notes": {},
                }

            day_type = schedule.get("dayType", "general")
            times_by_direction = schedule.get("timesByDirection", {})

            # Merge notes
            schedule_notes = schedule.get("notes", {})
            for note_id, note_text in schedule_notes.items():
                if note_id not in routes[route_number]["notes"]:
                    routes[route_number]["notes"][note_id] = note_text

            # Create schedule structure for this day type
            if day_type not in routes[route_number]["schedule"]:
                routes[route_number]["schedule"][day_type] = {}

            # Organize times by direction and hour
            for direction, times in times_by_direction.items():
                times_by_hour = self.organize_times_by_hour(times)

                for hour, time_entries in times_by_hour.items():
                    if hour not in routes[route_number]["schedule"][day_type]:
                        routes[route_number]["schedule"][day_type][hour] = {}

                    if (
                        direction
                        not in routes[route_number]["schedule"][day_type][hour]
                    ):
                        routes[route_number]["schedule"][day_type][hour][direction] = []

                    routes[route_number]["schedule"][day_type][hour][direction].extend(
                        time_entries
                    )

        return routes

    def save_route_schedule(self, route_number: str, route_data: Dict):
        """
        Save a single route schedule to file.

        Args:
            route_number: Route number
            route_data: Route schedule data
        """
        # Sanitize filename
        safe_route_name = re.sub(r"[^\w\-]", "_", route_number)
        filename = f"{safe_route_name}.json"
        output_file = self.schedules_dir / filename

        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(route_data, f, ensure_ascii=False, indent=4)
            print(f"  ✓ Saved {route_number} to {filename}")

        except Exception as e:
            print(f"  ✗ Error saving route {route_number}: {e}")

    def crawl_and_save(self):
        """
        Main method to crawl schedules and save them.
        """
        print("\n" + "=" * 60)
        print("Starting Bus Schedule Crawler")
        print("=" * 60 + "\n")

        # Fetch main page
        html = self.fetch_schedule_page()
        if not html:
            print("✗ Failed to fetch schedule data")
            return

        # Extract route information
        print("\nExtracting route information...")
        route_info = self.extract_route_info_from_main(html)
        print(f"✓ Found info for {len(route_info)} routes")

        # Extract route links
        route_ids = self.extract_route_links(html)
        print(f"✓ Found {len(route_ids)} route schedules")

        # Filter by specific route if specified
        if self.specific_route:
            print(f"\nFiltering for route: {self.specific_route}")
            route_ids = [
                rid for rid in route_ids if rid.startswith(self.specific_route)
            ]
            if not route_ids:
                print(f"✗ No schedules found for route {self.specific_route}")
                return
            print(f"✓ Found {len(route_ids)} schedules for route {self.specific_route}")

        # Fetch detail pages
        print(f"\nFetching detailed schedules...")
        schedules = []

        for i, route_id in enumerate(route_ids, 1):
            print(f"  [{i}/{len(route_ids)}] Fetching {route_id}...", end=" ")

            detail_html = self.fetch_detail_page(route_id)
            if detail_html:
                route_match = re.match(r"^(\S+?)(\(.*\))?$", route_id)
                route_number = (
                    route_match.group(1) if route_match else route_id.split("(")[0]
                )
                route_meta = route_info.get(route_number, {})

                schedule = self.parse_detail_schedule(
                    detail_html, route_id, route_meta=route_meta
                )
                schedules.append(schedule)
                print(f"✓ ({len(schedule['departureTimes'])} times)")
            else:
                print("✗ Failed")

            # Be nice to the server
            time.sleep(0.5)

        if not schedules:
            print("\n✗ No schedules retrieved")
            return

        # Merge and organize schedules
        print("\nOrganizing schedules...")
        merged_routes = self.merge_schedules(schedules, route_info)
        print(f"✓ Organized {len(merged_routes)} routes")

        # Save schedules
        print("\nSaving schedules...")
        for route_number, route_data in merged_routes.items():
            self.save_route_schedule(route_number, route_data)

        # Print summary
        print("\n" + "=" * 60)
        print("Summary:")
        print(f"  Total route files: {len(merged_routes)}")
        print(f"  Output directory: {self.schedules_dir}")
        print("=" * 60 + "\n")

        return merged_routes


def main():
    """
    Main entry point for the bus schedule crawler.
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Crawl bus schedules from Wonju Transit Information Center"
    )
    parser.add_argument(
        "--output", "-o", default="./storage", help="Output directory for schedule data"
    )
    parser.add_argument(
        "--route",
        "-r",
        default=None,
        help="Specific route number to crawl (e.g., 30, 34-1)",
    )

    args = parser.parse_args()

    processor = BusScheduleProcessor(output_dir=args.output, specific_route=args.route)
    processor.crawl_and_save()


if __name__ == "__main__":
    main()
