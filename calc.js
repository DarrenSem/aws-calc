// calc.js

"use strict";

// debugger;
var getUrlForApi;

if (typeof getUrlForApi !== "function") { var { getUrlForApi } = require("./getUrlForApi.js"); };

const str = v => JSON.stringify(v, null, "  ");

const paramsFromObject = o => (
  o == null
  ? ""
  : typeof URLSearchParams === "function"
  ? new URLSearchParams(o).toString()
  : require("querystring").stringify(o)
);

const calculateFromApi = async (num1, operator, num2, methodAWS) => {

  const UNDEF = undefined;

// debugger;
  let url = getUrlForApi();

  const method = methodAWS.toUpperCase();

  const methodAcceptsQSonly = /^(GET|HEAD)$/i;

  const bodyObject = {
    num1,
    operator,
    num2
  };

  let body = null;
  let qs = null;

  if (methodAcceptsQSonly.test(method)) {
    qs = paramsFromObject(bodyObject);
    if(qs.length) {
      url += "?" + qs;
    };
  } else {
    body =  str(bodyObject);
  };

  const options = {
    method: method,
    body: body ?? UNDEF,
    // bodyX: {
    //   httpMethod: method,
    //   queryStringParameters: qs ?? UNDEF,
    //   body: body ?? UNDEF,
    // },
    // headersX: {
    //   "content-type": "application/json"
    // },
  };

  const result = await fetch(url, options)
  .then(response => {
    // debugger;
    const { status: statusCode, headers, statusText } = response;
    // console.log(Object.fromEntries(headers));
    console.log(Object.fromEntries([...headers]));
    // if(!response.ok) { // if(statusCode < 200 || statusCode > 299) {
    //   throw Error(`${statusCode} ${statusText} ${str(headers)}`);
    // };
    return response.json();
  })
  .then(json => {
    const {jsonData, error, details, statusText} = json;
    // console.log(statusText, error, details, jsonData);
    // debugger;
    if(error) {
      throw Error(`${statusText}: ${error}`);
    };
    return jsonData;
  })
  .catch(err => {
    // console.log(err);
    // debugger;
    throw err;
  });

  debugger;
  return result;
};

const test = test_event => {
  console.log(JSON.stringify(test_event, null, "  "));
  const { httpMethod, queryStringParameters, body } = test_event;
  const { num1, operator, num2 } = body || queryStringParameters || {};
  // debugger;
  calculateFromApi(num1, operator, num2, httpMethod)
    .then(result => {
      console.log({ result });
      debugger;
    })
    .catch(err => {
      console.log(err);
      debugger;
    });
  // debugger;
};

if(typeof exports === "object") {
  exports.test = test;
};
