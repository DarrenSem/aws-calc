// calc.js

"use strict";

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
  };

  const calculated = await fetch(url, options)
  .then(response => {
    const { status: statusCode, headers, statusText } = response;
    // console.log(Object.fromEntries([...headers]));
    return response.json();
  })
  .then(json => {
    const {jsonData, error, details, statusText} = json;
    // console.log(statusText, error, details, jsonData);
    if(error) {
      throw Error(`${statusText}: ${error}`);
    };
    return jsonData;
  })
  .catch(err => {
    throw err;
  });

  return calculated;
};

const test = test_event => {
  console.log(JSON.stringify(test_event, null, "  "));
  const { httpMethod, queryStringParameters, body } = test_event;
  const { num1, operator, num2 } = body || queryStringParameters || {};
  calculateFromApi(num1, operator, num2, httpMethod)
    .then(result => {
      console.log({ result });
    })
    .catch(err => {
      console.log(err);
    });
};

if(typeof exports === "object") {
  exports.test = test;
};
