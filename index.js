// index.js for AWS Lambda function (CJS)

"use strict";

/*

// need ALL 3 (and also update API Gateway to say "CORS ENABLED" which creates a separate OPTIONS method!)
// headers: { "Access-Control-Allow-Origin": "*" },  // AHA! CORS was failing at every other host
headers: {
  // AHA! CORS was failing at every other host
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
},

const paramsFromObject = o => (
  o == null
  ? ""
  : typeof URLSearchParams === "function"
  ? new URLSearchParams(o).toString()
  : require('querystring').stringify(o)
);

// OK:
fetch("https://njr8tents5.execute-api.us-west-2.amazonaws.com/api/calc?num1=5", {method: "GET", body: JSON.stringify({abc:123})})
.then(response => { console.log(response); return response.text() })
.then(text => { console.log(text); return text })

// OK:
fetch("https://njr8tents5.execute-api.us-west-2.amazonaws.com/api/calc?num1=5", {method: "GET"})
.then(response => { console.log(response); return response.text() })
.then(text => { console.log(text); return text })

// OK:
fetch("https://njr8tents5.execute-api.us-west-2.amazonaws.com/api/calc?num1=5", {method: "GET"})
.then(response => { console.log(response); return response.text() })
.then(text => { console.log(text); return text })

// Uncaught (in promise) TypeError: Failed to execute 'fetch' on 'Window': Request with GET/HEAD method cannot have body.
fetch("https://njr8tents5.execute-api.us-west-2.amazonaws.com/api/calc?num1=5", {method: "GET", body: JSON.stringify({abc:123})})
.then(response => { console.log(response); return response.text() })
.then(text => { console.log(text); return text })


*/


/*
var url = "https://njr8tents5.execute-api.us-west-2.amazonaws.com/api/calc"

var options = {

  "method": "GET",

  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*" + "/*;q=0.8,application/signed-exchange;v=b3;q=0.7",

  "Accept-Encoding": "gzip, deflate, br",

  "Accept-Language": "en-US,en;q=0.9",

  "Upgrade-Insecure-Requests": "1",

  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"

}

var p = fetch(url, options);

^ NOPE! STILL FAILING

But, GUESS WHAT!? It's because I was only missing a single CORS header LOL:
headers: { "Access-Control-Allow-Origin": "*" }
^ see also "CORS enabling in AWS Lambda -- in API Gateway (proxy) too, because otherwise OPTIONS preflight will fail!.md"

*/

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
    // headers: { "Access-Control-Allow-Origin": "*" },  // AHA! CORS was failing at every other host
    headers: {
      // AHA! CORS was failing at every other host
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
    },
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
      return "[noop]";  // TODO: return an object with the error details the same way the API call would.
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

  const json = parseJSON(data, !"returnDataIfInvalid");
  console.log(`json from parseJSON(data, !"returnDataIfInvalid"):`, json);
  debugger;

  // let statusCode = 200, statusText = "OK", error, details = UNDEF, body = UNDEF, contentType = UNDEF;
  let statusCode, statusText, error, details, body, contentType;
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
  };

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
        // perform GET action based on json
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "POST":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        // perform POST action based on json
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
        // perform PUT action based on json
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "PATCH":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        // perform PATCH action based on json
        [statusCode, statusText, headers, body, details] = okRequest(
          num1, operator, num2, result, headers, method, contentType
        );
      };
      break;

    case "DELETE":
      if(invalid) {
        [statusCode, statusText, error, details] = badRequest(data, jsonMissing ? UNDEF : `Unrecognized Operator: ${operator}`);
      } else {
        // perform DELETE action based on json
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
