// ; var test;
// if (typeof test !== "function") { var { test } = require("../calc.js"); };
// test(test_event);
require("../calc.js").test(

{
  "httpMethod": "post",
  "body": {
    "num1": "value1",
    "num2": "value2",
    "operator": "value3"
  }
}

);
