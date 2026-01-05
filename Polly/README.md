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

## Architecture

### Live API Flow

`ORIGIN -> API Gateway -> CloudFront -> Client`

### Static Data Flow

`S3 -> CloudFront -> Client`

## Reference Settings for API Gateway

```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "wBus",
    "description": "API Gateway for Visualized Bus Project",
    "version": "2026-01-02 00:00:00UTC"
  },
  "servers": [
    {
      "url": "https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/{basePath}",
      "variables": {
        "basePath": {
          "default": ""
        }
      }
    }
  ],
  "paths": {
    "/getBusArrivalInfo/{busStopId}": {
      "get": {
        "responses": {
          "default": {
            "description": "Default response for GET /getBusArrivalInfo/{busStopId}"
          }
        },
        "x-amazon-apigateway-integration": {
          "responseParameters": {
            "200": {
              "overwrite:header.Cache-Control": "public, max-age=3"
            }
          },
          "requestParameters": {
            "append:querystring.nodeId": "$request.path.busStopId",
            "append:querystring.numOfRows": "32",
            "append:querystring.pageNo": "1",
            "append:querystring._type": "json",
            "append:querystring.cityCode": "32020",
            "append:querystring.serviceKey": "PASTE_YOUR_KEY"
          },
          "payloadFormatVersion": "1.0",
          "type": "http_proxy",
          "httpMethod": "GET",
          "uri": "http://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList",
          "connectionType": "INTERNET",
          "timeoutInMillis": 12000
        }
      },
      "parameters": [
        {
          "name": "busStopId",
          "in": "path",
          "description": "Generated path parameter for busStopId",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ]
    },
    "/getBusLocation/{routeId}": {
      "get": {
        "responses": {
          "default": {
            "description": "Default response for GET /getBusLocation/{routeId}"
          }
        },
        "x-amazon-apigateway-integration": {
          "responseParameters": {
            "200": {
              "overwrite:header.Cache-Control": "public, max-age=3"
            }
          },
          "requestParameters": {
            "append:querystring.numOfRows": "32",
            "append:querystring.pageNo": "1",
            "append:querystring._type": "json",
            "append:querystring.cityCode": "32020",
            "append:querystring.routeId": "$request.path.routeId",
            "append:querystring.serviceKey": "PASTE_YOUR_KEY"
          },
          "payloadFormatVersion": "1.0",
          "type": "http_proxy",
          "httpMethod": "GET",
          "uri": "http://apis.data.go.kr/1613000/BusLcInfoInqireService/getRouteAcctoBusLcList",
          "connectionType": "INTERNET",
          "timeoutInMillis": 12000
        }
      },
      "parameters": [
        {
          "name": "routeId",
          "in": "path",
          "description": "Generated path parameter for routeId",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ]
    },
    "/getBusStopLocation/{routeId}": {
      "get": {
        "responses": {
          "default": {
            "description": "Default response for GET /getBusStopLocation/{routeId}"
          }
        },
        "x-amazon-apigateway-integration": {
          "responseParameters": {
            "200": {
              "overwrite:header.Cache-Control": "public, max-age=3"
            }
          },
          "requestParameters": {
            "append:querystring.numOfRows": "512",
            "append:querystring.pageNo": "1",
            "append:querystring._type": "json",
            "append:querystring.cityCode": "32020",
            "append:querystring.routeId": "$request.path.routeId",
            "append:querystring.serviceKey": "PASTE_YOUR_KEY"
          },
          "payloadFormatVersion": "1.0",
          "type": "http_proxy",
          "httpMethod": "GET",
          "uri": "http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList",
          "connectionType": "INTERNET",
          "timeoutInMillis": 12000
        }
      },
      "parameters": [
        {
          "name": "routeId",
          "in": "path",
          "description": "Generated path parameter for routeId",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ]
    }
  },
  "x-amazon-apigateway-cors": {
    "allowMethods": [
      "GET"
    ],
    "allowHeaders": [
      "*"
    ],
    "exposeHeaders": [
      "date"
    ],
    "maxAge": 300,
    "allowCredentials": true,
    "allowOrigins": [
      "https://wbus.vercel.app"
    ]
  },
  "x-amazon-apigateway-importexport-version": "1.0"
}
```
