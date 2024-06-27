// migrations/add_role_column.js

exports.up = function(knex) {
    return knex.schema.alterTable('users', function(table) {
      table.string('role').notNullable().defaultTo('enduser');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('users', function(table) {
      table.dropColumn('role');
    });
  };

  