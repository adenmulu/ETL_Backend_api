const { Model } = require("objection");
const knex = require("../database");

Model.knex(knex);

class OTsales extends Model {
  static get tableName() {
    return "OTsales";
  }
}

module.exports = OTsales;
