// index.js for AWS Lambda function (CJS)

"use strict";

const DEBUG_ENV_AWS = typeof process === "object" && (
  process.env.AWS_EXECUTION_ENV || process.env.LAMBDA_TASK_ROOT
);

const DEBUG_TEST_DYNAMODB = !!"DEBUG_TEST_DYNAMODB"; // const handler = DEBUG_TEST_DYNAMODB ? handler_test_dynamodb : handler_final
const DEBUG_TEST_FORCE_V2 = !!"DEBUG_TEST_FORCE_V2";

const AWS_CONFIG = { region: "us-west-2" };

const CORS_ALLOWED_ORIGINS = [
  // "https://jsonplaceholder.typicode.com/",
  // "https://EXAMPLE.com/", // secure only, and ROOT only (includes NEITHER http://www.example.com NOR https://www.example.com)
  "https://darrensem.GitHub.io"
];

// AWS SDK v3 is pre-installed -- instead of v2 -- if Node.js 18.x+ [Edit "Runtime settings"]
// via https://stackoverflow.com/questions/74792293/aws-lambda-cannot-find-module-aws-sdk-in-build-a-basic-web-application-tutoria/74792625#74792625
const getAWS = (SDKforceV3 = typeof process === "object" && process.version >= "v18", client = "/client-dynamodb") => {
  console.log("getAWS() client:", client, ", SDKforceV3:", SDKforceV3);
  const returned = require(
    SDKforceV3
    ? `@aws-sdk${client}`
    : "aws-sdk"
  );
  console.log("returned:", !!returned);
  return returned;
};

// const handler_testing = async (event, context) => {
const handler_test_dynamodb = async (event, context, callback, SDKforceV2) => {

  // debugger;
  console.log("SDKforceV2:", SDKforceV2, ", process.version: Node", process.version);
  const AWS = getAWS(SDKforceV2 ? false : undefined);
  // const AWS = require("aws-sdk");
  // const AWS = require("@aws-sdk/client-dynamodb");
  // return str(!!AWS, true);

  // const usingAWS3 = typeof AWS.DynamoDB !== "function";
  const usingAWS3 = !AWS.config;
  console.log("usingAWS3:", usingAWS3);
  console.log( "typeof AWS:", typeof AWS, {}.toString.call(AWS), AWS.constructor.name );
  console.log( "typeof AWS.config:", typeof AWS.config, {}.toString.call(AWS.config) );
  debugger;
// return "TODO:";

  const {
    httpMethod: method,
    body: body,
    queryStringParameters: qs,
  } = { ...event };
  console.log("request body:", body);
  console.log("request queryStringParameters:", qs);
  // debugger;

  const { first, second } = { ...(body ?? qs) };
  console.log("first:", first);
  console.log("second:", second);
  // debugger;

  // let name = JSON.stringify(`${`${first ?? ""} ${second ?? ""}`.trim()}.`);
  let name = `${`${first ?? ""} ${second ?? ""}`.trim()}.`;
  console.log(`Hello from Lambda, name=${name}`);

  const now = new Date().toISOString();
  console.log("now:", now);

  const params = {
    TableName: "math-log",
    Item: {
      // SDK v3 = datatypes ("S" for String, "N" for Number, etc.)
      id: usingAWS3 ? { S: name } : name,
      "latest-greeting-time": usingAWS3 ? { S: now } : now,
    },
  };
  console.log(`params ${usingAWS3 ? "v3:" : "v2:"}`, params);

  debugger;
  // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html
  let configLoaded = {};
  try {
    configLoaded = require("./research/credentials.aws.json");
  } catch(e) {};

  const configMerged = { ...configLoaded, ...AWS_CONFIG };
  console.log("configLoaded:", Object.keys(configLoaded));
  console.log("AWS_CONFIG:", Object.keys(AWS_CONFIG));
  console.log("configMerged:", Object.keys(configMerged));
  debugger;

  if(!usingAWS3) {
    console.log( "AWS.config before:", Object.keys(AWS.config || {}) );
    console.log( "AWS.config.credentials before:", Object.keys(AWS.config?.credentials || {}) );
    const configReturnedNope = AWS.config?.update?.({
      accessKeyId: configMerged?.credentials?.accessKeyId,
      secretAccessKey: configMerged?.credentials?.secretAccessKey,
      region: configMerged.region
    });
    console.log( "configReturnedNope === undefined:", configReturnedNope === undefined );
    console.log( "AWS.config after:", Object.keys(AWS.config) );
    console.log( "AWS.config.credentials after:", Object.keys(AWS.config.credentials || {}) );
    // console.log(AWS.config);
    debugger;

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#credentials-property
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html

    // const configFinalV2 = new AWS.Config({
    //  accessKeyId: configMerged.credentials.accessKeyId,
    //  secretAccessKey: configMerged.credentials.secretAccessKey,
    //  region: configMerged.region,
    // });
    // console.log("configFinalV2:", str(configFinalV2, true));
    // AWS.config.update(configFinalV2);
  };


  // const DynamoDBClient = new AWS.DynamoDB.DocumentClient(); // SDK v2
  const { DynamoDB, DynamoDBClient, PutItemCommand } = AWS; // DynamoDB = SDK v2; DynamoDBClient + PutItemCommand = SDK v3
  // console.log({ DynamoDB, DynamoDBClient, PutCommand });
  // console.log("DynamoDB v2:", DynamoDB);
  // console.log("DynamoDBClient v3:", DynamoDBClient);
  console.log("PutItemCommand v3:", PutItemCommand);

  const clientDDB = DynamoDBClient ?? new DynamoDB.DocumentClient(); // SDK v3 ?? SDK v2
  console.log("clientDDB:", clientDDB);
  debugger;

  var result;

  if (usingAWS3) {
    // ??? https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html#constructor-property
    // result = { $response: { httpResponse: { body: null } } }; // TODO: temp because immediately fails...
    const client = new clientDDB(configMerged); // SDK v3
    console.log("client v3:", client);
    result = await client.send(new PutItemCommand(params));
  } else {
    result = await clientDDB.put(params).promise(); // SDK v2
    // result = await clientDDB.patch(params).promise(); // TypeError: clientDDB.patch is not a function
    // ...so then how to do a PARTIAL update?
    // AHA, config must run BEFORE other calls:
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/introduction/#configuration
    // "version 2.x of the SDK... calling AWS.config.update({/* params */}) only updated configuration
    // for service clients instantiated after the update call was made, not any existing clients."
  }
  console.log(`\n\n*** result v${usingAWS3 ? "3" : "2"}:`, "[[ @", now, "]]", str(result, true));  // v3:/v2:
  debugger;

  const responseBody = usingAWS3 ? result.$metadata : result.$response.httpResponse.body;
  console.log("v2 sanity check:", String(responseBody) === "{}"); // .send(PutCommand, p) / .put(p)
  console.log("v3 sanity check:", responseBody?.httpStatusCode === 200);
  debugger;

  const response = {
    headers: headersCORS(CORS_ALLOWED_ORIGINS[0]),
    statusCode: 200,
    body: str(
      {
        // event,
        name,
        // result: []
        result,
      },
      true
    ),
  };
  console.log("\n\n>>> FINAL response:", response);
  // debugger;

  return response;
};

const handler_final = async (event, context) => {

  console.log("event:", event);

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
  
  const response = buildResponse(method, data, qs, body, headers, event);
  console.log("response:", response);

  return response;

};

const handler = DEBUG_TEST_DYNAMODB ? handler_test_dynamodb : handler_final;

const getOrigin = reqHeaders => {
  reqHeaders ||= {};
  
  const origin = reqHeaders.origin ?? reqHeaders.Origin;
  const referer = reqHeaders.referer ?? reqHeaders.Referer;

  const result = origin ?? referer ?? null;

  // console.log("getOrigin reqHeaders:", reqHeaders);
  console.log(".origin:", origin);
  console.log(".referer:", referer);
  console.log("result:", result);
  
  return result;
};

const noEndingSlashLC = v => String(v ?? "").replace(/\/+$/, "").toLowerCase();

const headersCORS = (origin, listOfAllowed) => {

  origin = noEndingSlashLC(origin);
  listOfAllowed = (listOfAllowed || CORS_ALLOWED_ORIGINS).map(noEndingSlashLC);

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

  return result;
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

const parseJSON = (data = null, returnDataIfInvalid) => {
  try {
    if(typeof data === "object") {
      console.log("parseJSON -- data:", data);
      return data;
    };
    console.log("parseJSON -- JSON.parse(data):", JSON.parse(data));
    return JSON.parse(data);
  } catch (e) {
    console.log("parseJSON -- returnDataIfInvalid:", returnDataIfInvalid, ", data:", data);
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

  // let statusCode = 200, statusText = "OK", error, details = UNDEF, body = UNDEF, contentType = UNDEF;
  let statusCode, statusText, error, details, body, contentType;
  let headers = headersCORS(requestOrigin);

  const json = parseJSON(data, !"returnDataIfInvalid");
  console.log(`json from parseJSON(data, !"returnDataIfInvalid"):`, json);

  const {
    num1,
    operator,
    num2
  } = {...json};
  console.log("num1:", num1);
  console.log("operator:", operator);
  console.log("num2:", num2);

  const result = calculate(num1, operator, num2);
  console.log("calculated result:", result);

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

  return response;
  
};

if(typeof exports === "object") { exports.handler = handler; }; // CJS (index.js)
// export { handler }; // ESM (index.mjs, only if index.js is not found -- even if it failed to export .handler)

const test_handler_if_not_AWS = async (isAWS) => {
  console.log("test_handler_if_not_AWS(isAWS) , isAWS =", isAWS);
  if(isAWS) {
    return;
  };

  const test_event = {
    httpMethod: "POST",
    body: {
      first: "Chris",
      second: "King",
    },
  };

  const result = await handler(test_event, undefined, undefined, DEBUG_TEST_FORCE_V2);
  console.log(result);
  // debugger;

};
test_handler_if_not_AWS(DEBUG_ENV_AWS);
