// fa_Customerdata.model.js

const { Model } = require("objection");
const knex = require("../database"); // Adjust the path as per your project structure

Model.knex(knex);

class CustomerData extends Model {
  static get tableName() {
    return "CustomerData"; // Adjust the table name as per your database schema
  }
}

module.exports = CustomerData;
