// models/user.model.js

const { Model } = require("objection");
const bcrypt = require("bcryptjs");

class User extends Model {
  static get tableName() {
    return "users";
  }

  // Example method to hash password before saving
  async $beforeInsert(context) {
    await super.$beforeInsert(context);
    this.password = await bcrypt.hash(this.password, 10);
  }
}

module.exports = User;
