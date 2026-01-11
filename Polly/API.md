# API

Documentation for the `API Gateway` and `CloudFront` configuration used in the Visualized Bus Project.

## Architecture

### Live API Flow

`Origin (Public Data API) -> API Gateway (Parameter Mapping & Header Injection) -> CloudFront (Edge Caching) -> Client`

### Static Data Flow

`S3 (JSON/Static Assets) -> CloudFront -> Client`

## Reference Settings for CloudFront

The important point is `micro-caching` configuration for reducing latency and cost. To respect the `Cache-Control` headers from API Gateway, use the following Cache Policy settings:

- Minimum TTL: 0 (Critical: Allows API Gateway's max-age=2 to take precedence).

- Maximum TTL: 31536000 (1 year).

- Default TTL: 2 (Aligned with our micro-caching strategy).

- Cache Key Settings:

  - Headers: None (or 'Origin' if using multiple origins).

  - Query Strings: All (Required for busStopId and routeId variations).

  - Cookies: None.

## Reference Settings for API Gateway

```json
{
  "openapi" : "3.0.1",
  "info" : {
    "title" : "wBus",
    "description" : "API Gateway for Visualized Bus Project",
    "version" : "2026-01-11 06:08:40UTC"
  },
  "servers" : [ {
    "url" : "https://felidae.execute-api.ap-northeast-2.amazonaws.com/{basePath}",
    "variables" : {
      "basePath" : {
        "default" : ""
      }
    }
  } ],
  "paths" : {
    "/getBusArrivalInfo/{busStopId}" : {
      "get" : {
        "responses" : {
          "default" : {
            "description" : "Default response for GET /getBusArrivalInfo/{busStopId}"
          }
        },
        "x-amazon-apigateway-integration" : {
          "responseParameters" : {
            "200" : {
              "overwrite:header.Cache-Control" : "public, max-age=2, stale-while-revalidate=4"
            }
          },
          "requestParameters" : {
            "append:querystring.nodeId" : "$request.path.busStopId",
            "append:querystring.numOfRows" : "1024",
            "append:querystring.pageNo" : "1",
            "append:querystring._type" : "json",
            "append:querystring.cityCode" : "32020",
            "append:querystring.serviceKey" : "DECODED_KEY"
          },
          "payloadFormatVersion" : "1.0",
          "type" : "http_proxy",
          "httpMethod" : "GET",
          "uri" : "http://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList",
          "connectionType" : "INTERNET",
          "timeoutInMillis" : 12000
        }
      },
      "parameters" : [ {
        "name" : "busStopId",
        "in" : "path",
        "description" : "Generated path parameter for busStopId",
        "required" : true,
        "schema" : {
          "type" : "string"
        }
      } ]
    },
    "/getBusLocation/{routeId}" : {
      "get" : {
        "responses" : {
          "default" : {
            "description" : "Default response for GET /getBusLocation/{routeId}"
          }
        },
        "x-amazon-apigateway-integration" : {
          "responseParameters" : {
            "200" : {
              "overwrite:header.Cache-Control" : "public, max-age=2, stale-while-revalidate=4"
            }
          },
          "requestParameters" : {
            "append:querystring.numOfRows" : "1024",
            "append:querystring.pageNo" : "1",
            "append:querystring._type" : "json",
            "append:querystring.cityCode" : "32020",
            "append:querystring.routeId" : "$request.path.routeId",
            "append:querystring.serviceKey" : "DECODED_KEY"
          },
          "payloadFormatVersion" : "1.0",
          "type" : "http_proxy",
          "httpMethod" : "GET",
          "uri" : "http://apis.data.go.kr/1613000/BusLcInfoInqireService/getRouteAcctoBusLcList",
          "connectionType" : "INTERNET",
          "timeoutInMillis" : 12000
        }
      },
      "parameters" : [ {
        "name" : "routeId",
        "in" : "path",
        "description" : "Generated path parameter for routeId",
        "required" : true,
        "schema" : {
          "type" : "string"
        }
      } ]
    },
    "/getBusStopLocation/{routeId}" : {
      "get" : {
        "responses" : {
          "default" : {
            "description" : "Default response for GET /getBusStopLocation/{routeId}"
          }
        },
        "x-amazon-apigateway-integration" : {
          "responseParameters" : {
            "200" : {
              "overwrite:header.Cache-Control" : "public, max-age=1000, stale-while-revalidate=24"
            }
          },
          "requestParameters" : {
            "append:querystring.numOfRows" : "1024",
            "append:querystring.pageNo" : "1",
            "append:querystring._type" : "json",
            "append:querystring.cityCode" : "32020",
            "append:querystring.routeId" : "$request.path.routeId",
            "append:querystring.serviceKey" : "DECODED_KEY"
          },
          "payloadFormatVersion" : "1.0",
          "type" : "http_proxy",
          "httpMethod" : "GET",
          "uri" : "http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList",
          "connectionType" : "INTERNET",
          "timeoutInMillis" : 12000
        }
      },
      "parameters" : [ {
        "name" : "routeId",
        "in" : "path",
        "description" : "Generated path parameter for routeId",
        "required" : true,
        "schema" : {
          "type" : "string"
        }
      } ]
    }
  },
  "x-amazon-apigateway-cors" : {
    "allowMethods" : [ "GET", "HEAD", "OPTIONS" ],
    "allowHeaders" : [ "client", "content-type" ],
    "exposeHeaders" : [ "date" ],
    "maxAge" : 300,
    "allowCredentials" : false,
    "allowOrigins" : [ "https://wbus.vercel.app" ]
  },
  "x-amazon-apigateway-importexport-version" : "1.0"
}
```
