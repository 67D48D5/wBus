# Polly

This section provides an overview of the backend architecture and components used in the project.

## Use of static data processors

```bash
# Process all routes
python src/BusRouteProcessor.py

# Process only route 30
python src/BusRouteProcessor.py --route 30

# Process route 34 with custom city code
python src/BusRouteProcessor.py --route 34 --city-code 32020

# Process all routes with custom output directory
python src/BusRouteProcessor.py --output-dir /custom/path
```

```bash
# Crawl all bus schedules
python src/BusScheduleProcessor.py

# Crawl only route 30 schedule
python src/BusScheduleProcessor.py --route 30
python src/BusScheduleProcessor.py -r 34-1

# Crawl all schedules with custom output directory
python src/BusScheduleProcessor.py --route 30 --output ./custom_output
```
