const { Model } = require('objection');
const knex = require('../database');

Model.knex(knex);

class SalesRepo0 extends Model {
  static get tableName() {
    return 'SalesRepo0'; // Replace with your actual table name
  }
}

module.exports = SalesRepo0;
