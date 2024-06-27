const axios = require("axios");
const logger = require("./logger");

const roleAllowed = (role) => {
  if (role === "admin" || role === "finance") return true;
  else return false;
};

exports.verify = async (req, res, next) => {
  const { _PORT } = require("../server");
  try {
    let token = req.body?.x_access_token;
    if (!token) {
      return res.status(400).send({
        error: "no access token provided",
      });
    }
    
    //return select all rows
    const url = `${process.env.MS_AUTH_URL}:${_PORT - 2}/v1/verify`;
    axios
      .post(url, {
        x_access_token: token,
      })
      .then((response) => {
        // handle success
        req.userData = response.data.userData;
        if (!roleAllowed(response.data.userData.role))
          throw "access to protected endpoint denied because the token provided is of a user with a disallowed role";
        logger("info", "access to protected endpoint granted");
        next();
      })
      .catch((err) => {
        const error = err.response?.data?.message
          ? err.response?.data?.message
          : err;
        logger("error", error);
        return res.status(400).send({
          error,
        });
      });
  } catch (err) {
    logger("error", err);
    return res.status(500).send({
      error: err,
    });
  }
};
