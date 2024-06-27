// migrations/20240530140000_create_users_table.js
exports.up = function(knex) {
    return knex.schema.createTable("users", function(table) {
      table.increments("id").primary();
      table.string("username").unique().notNullable();
      table.string("password").notNullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists("users");
  };
  