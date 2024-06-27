const Model = require("../database");

// List model.
class Alltest extends Model {
  static get tableName() {
    return "AllYTDDep&BookVMonthly";
  }
}
module.exports = Alltest;
