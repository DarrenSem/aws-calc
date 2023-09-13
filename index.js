// index.js for AWS Lambda function (CJS)

"use strict";

const CORS_ALLOWED_ORIGINS = [
  "https://darrensem.github.iO",
  // "https://jsOnplacehOlder.com",
  // "https://foobar.example.com",
  // "https://chriszarate.github.io"
];

const getOrigin = reqHeaders => {
  reqHeaders ||= {};
  
  const origin = reqHeaders.origin ?? reqHeaders.Origin;
  const referer = reqHeaders.referer ?? reqHeaders.Referer;

  // const result = "https://fizzbuzz.example.com";
  // const result = "https://jsonplaCeholder.com";
  // const result = "https://disallowed.github.io";
  // const result = "https://darrensem.github.io";
  const result = origin ?? referer ?? null;
  debugger;

  console.log("getOrigin reqHeaders:", reqHeaders);
  console.log(".origin:", origin);
  console.log(".referer:", referer);
  console.log("origin ?? referer ?? null:", origin ?? referer ?? null);
  console.log("result:", result);
  debugger;
  
  return result;
};

const headersCORS = (origin, listOfAllowed) => {

  // debugger;
  origin = String(origin ?? "").replace(/\/+$/, "").toLowerCase();
  listOfAllowed = (listOfAllowed || CORS_ALLOWED_ORIGINS).map(el => String(el).toLowerCase());

  const allowedOrNull = listOfAllowed.includes(origin)
  ? origin
  : null;

  const result = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "Access-Control-Allow-Origin": allowedOrNull,
    "Access-Control-Allow-Credentials": true
  };

  console.log("origin:", origin);
  console.log("listOfAllowed:", listOfAllowed);
  console.log("allowedOrNull:", allowedOrNull);
  console.log("headersCORS:", result);
  // debugger;

  return result;
};

const headersCORS_single = () => {
  return   {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "Access-Control-Allow-Origin": "https://darrensem.github.io",
    // "Access-Control-Allow-Origin": null,
    // "Access-Control-Allow-Origin": "*",
    // "Access-Control-Allow-Origin": "https://example.com https://darrensem.github.io", // multiple is NOT supported, NOT valid ***
    "Access-Control-Allow-Credentials": true
  };
  // *** only a SINGLE exact value or null or "*" -- not possible for HEADERS to automatically accept MULTIPLE hosts/domains/origins:
  // https://stackoverflow.com/questions/1653308/access-control-allow-origin-multiple-origin-domains/28552592#28552592
  // instead would have to handle it on the SERVER -- for example: ```CSharp
  //   string allowedDomains = "http://xxx.yyy.example|http://aaa.bbb.example";
  //   if(allowedDomains.IndexOf(HttpContext.Current.Request.Headers["Origin"]) > -1) {
  //     HttpContext.Current.Response.AddHeader("Access-Control-Allow-Origin", HttpContext.Current.Request.Headers["Origin"]);
  //   }; ```
  // cf. https://fetch.spec.whatwg.org/#http-access-control-allow-origin
  // ^ "response can be shared = returning theliteral value of the `Origin` request header (which can be `null`) or `*` in a response"
  // https://fetch.spec.whatwg.org/#http-new-header-syntax
  // ^ "Access-Control-Allow-Origin      = origin-or-null / wildcard ('*')"
};

const str = (v, isJson) => {
  if(v != null) {
    return (
      isJson
      ? JSON.stringify(v, null, "\t")
      : v // NOTE: `v` not `String(v)`
    );
  };
};

const str_opposite = (v, stringNotJson) => {
  if(v != null) {
    return (
      stringNotJson
      ? String(v)
      : JSON.stringify(v, null, "\t")
    );
  };
};

const handler_testing_CORS = async (event, context) => {

  const response = {
    // headers: headersCORS("https://fizzbuzz.example.com"),
    headers: headersCORS( CORS_ALLOWED_ORIGINS[0] ),
    statusCode: 200,
    body: str({
      event
    }, true)
  };
  console.log(response);
  debugger;

  return response;

};

const handler = async (event, context) => {

  console.log("event:", event);
  debugger;

  const {
    httpMethod: method,
    headers,
    queryStringParameters: qs,
    body
  } = {...event};
  console.log("request httpMethod:", method);
  console.log("request headers:", headers);
  console.log("request queryStringParameters:", qs);
  console.log("request body:", body);
  debugger;

  const methodAcceptsQSonly = /^GET$/i;
  const methodAcceptsBodyIfNullQS = /^DELETE/i;

  const data = (
    methodAcceptsQSonly.test(method)
    ? qs
    : methodAcceptsBodyIfNullQS.test(method)
    ? ( qs ?? body )
    : body
  );
  console.log("methodAcceptsQSonly:", methodAcceptsQSonly);
  console.log("methodAcceptsBodyIfNullQS:", methodAcceptsBodyIfNullQS);
  console.log("data from qs/body:", data);
  debugger;
  
  const response = buildResponse(method, data, qs, body, headers, event);
  console.log("response:", response);
  debugger;

  return response;

};

const parseJSON = (data = null, returnDataIfInvalid) => {
  try {
    if(typeof data === "object") {
      console.log("parseJSON -- data:", data);
      debugger;
      return data;
    };
    console.log("parseJSON -- JSON.parse(data):", JSON.parse(data));
    debugger;
    return JSON.parse(data);
  } catch (e) {
    console.log("parseJSON -- returnDataIfInvalid:", returnDataIfInvalid, "data:", data);
    debugger;
    return returnDataIfInvalid ? data : null;
  };
};

const calculate = (num1, operator, num2) => {

  num1 = parseFloat(num1); // because +v or Number(v) both return 0 instead of NaN...
  num2 = parseFloat(num2); // ...when v = null or [] or " ".

  switch (operator) {
    case "plus":
      return num1 + num2;
    case "minus":
      return num1 - num2;
    case "times":
      return num1 * num2;
    case "divided by":
      return num1 / num2;
    case "to the power of":
      return Math.pow(num1, num2);
    default:
      return "[noop]";
  };
};

const badRequest = (data, error = "INVALID_JSON", statusCode = 400, statusText = "Bad Request") => {
  return [statusCode, statusText, error, data];
};

const okRequest = (num1, operator, num2, result, headers, method, contentType, statusCode = 200, statusText = "OK") => {
  return [
    statusCode,
    statusText,
    { ...headers, "content-type": contentType },
    result,
    `${method}: ${num1} ${operator ?? "+"} ${num2} = ${result}`
  ];
};

const buildResponse = (method, data, reqQS, reqBody, reqHeaders, reqEvent) => {

  const UNDEF = undefined;

  const requestOrigin = getOrigin(reqHeaders);
  console.log(`buildResponse requestOrigin:`, requestOrigin);
  debugger;

  // let statusCode = 200, statusText = "OK", error, details = UNDEF, body = UNDEF, contentType = UNDEF;
  let statusCode, statusText, error, details, body, contentType;
  let headers = headersCORS(requestOrigin);

  const json = parseJSON(data, !"returnDataIfInvalid");
  console.log(`json from parseJSON(data, !"returnDataIfInvalid"):`, json);
  debugger;

  const {
    num1,
    operator,
    num2
  } = {...json};
  console.log("num1:", num1);
  console.log("operator:", operator);
  console.log("num2:", num2);
  debugger;

  const result = calculate(num1, operator, num2);
  console.log("calculated result:", result);
  debugger;

  const jsonMissing = json == null;
  const invalid = jsonMissing || typeof result !== "number";

  switch(method?.toUpperCase()) {

    // case "OPTIONS": // not possible via Web fetch() -- perhaps due to API Gateway CORS setup, idk...
    //   [statusCode, statusText] = [204, "No Content"];
    //   headers["allow"] = "OPTIONS, GET, POST, PUT, PATCH, DELETE";
    //   // body = null;
    //   break;

    // case "HEAD":
    //   [statusCode, statusText] = [204, "No Content"];
    //   headers["allow"] = "OPTIONS, GET, POST, PUT, PATCH, DELETE";  // ...this also doesn't work (headers = {} empty; not even "Access-Control-Allow-Origin"!)
    //   // body = null;
    //   break;

    case "GET":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "POST":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
          , "201", "Created"
        );
      };
      break;

    case "PUT":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "PATCH":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "DELETE":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        [statusCode, statusText] = [204, "No Content"];
        details = json;
      };
      break;

    default:
      [statusCode, statusText, error, details] = badRequest(data, `METHOD_${method}`, 405, "Method Not Allowed");
      // body = null;
      break;

  };

  const bodyIsJson = !contentType || /^\s*application\/json/i.test(contentType);

  const response = {
    // AWS API Gateway returns 502 "Internal server error" if any field other than these 4:
    // [statusCode(default = 200), headers({}), body(""), isBase64Encoded(false)]
    // AKA all of these will fail (with the DEFAULT CONFIG of AWS API Gateway): statusText, statusMessage, status, message
    
  statusCode,
    headers, // for ["content-type"] API Gateway falls back to default value of "application/json"
    body:
      str(
        {
          jsonData: str(body),
          error: str(error),
          details: str(details),
          statusText,
        },
        bodyIsJson
      ) ?? "",
  };
  console.log("statusCode:", statusCode);
  console.log("statusText:", statusText);
  console.log("headers:", headers);
  console.log("body:", body);
  console.log("bodyIsJson:", bodyIsJson);
  console.log("error:", error);
  console.log("details:", details);
  console.log("returned response body:", response.body);
  debugger;

  return response;
  
};

if(typeof exports === "object") { exports.handler = handler; }; // CJS (index.js)
// export { handler }; // ESM (index.mjs, only if index.js is not found -- even if it failed to export .handler)
