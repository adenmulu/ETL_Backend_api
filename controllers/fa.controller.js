const logger = require("./logger");

let cache = {
  all: null,
  alltest: null,
  otsales: null,
  salesrepo0: null,
};

const fa = async (req, res, model) => {
  try {
    const cacheKey = getCacheKey(model);
    const { page = 1, pageSize = 100 } = req.query;
    const offset = (page - 1) * pageSize;

    if (cache[cacheKey]) {
      const paginatedData = cache[cacheKey].slice(offset, offset + pageSize);
      return res.status(200).send({
        message: "success",
        data: paginatedData,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: cache[cacheKey].length,
      });
    }

    // Fetch data from the database using Knex
    const result = await model.query()
      .select('*')
      .limit(pageSize)
      .offset(offset);

    cache[cacheKey] = result;

    const paginatedData = result.slice(0, pageSize);
    res.status(200).send({
      message: "success",
      data: paginatedData,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: result.length,
    });
  } catch (err) {
    logger("error", err);
    res.status(500).send({
      error: err.message,
    });
  }
};

const fetchDataAndCache = async (model, cacheKey) => {
  try {
    const result = await model.query().select('*');
    cache[cacheKey] = result;
    logger("info", `Cache updated for ${cacheKey}`);
  } catch (err) {
    logger("error", err);
  }
};

const getCacheKey = (model) => {
  switch (model) {
    case require("../models/fa_CustomerData.model"):
      return 'all';
    case require("../models/fa_Alltest.model"):
      return 'alltest';
    case require("../models/fa_OTsales.model"):
      return 'otsales';
    case require("../models/fa_SalesRepo0.model"):
      return 'salesrepo0';
    default:
      throw new Error("Unknown model");
  }
};

module.exports = { fa, fetchDataAndCache };
