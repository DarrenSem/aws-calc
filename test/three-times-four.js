// ; var test;
// if (typeof test !== "function") { var { test } = require("../calc.js"); };
// test(test_event);
require("../calc.js").test(

{
  "httpMethod": "post",
  "body": {
    "operator": "times",
    "num2": 4,
    "num1": "3.0"
  }
}

);
