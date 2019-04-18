const winston = require("winston");
const express = require("express");
const config = require("config");
const cors = require("cors");

const app = express();
app.use(
  cors({
    exposedHeaders: ["x-auth-token"]
  })
);

require("./startup/logging")();
require("./startup/routes")(app);

require("./startup/db")();
require("./startup/config")();

require("./startup/validation")();
require("./startup/prod")(app);

const port = process.env.PORT || config.get("port");
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}...`)
);

module.exports = server;
