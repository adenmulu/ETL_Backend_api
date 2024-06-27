const { Model } = require("objection");
const Knex = require("knex");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.development file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Log environment variables to ensure they are loaded correctly (optional)
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'Not Set');
console.log('DB_NAME:', process.env.DB_NAME);

// Check if all required environment variables are provided
if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('Missing one or more required environment variables');
}

// Create connection object
const connString = {
  client: "mssql",
  connection: {
    server: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      encrypt: true, // Adjust this based on your database configuration
      enableArithAbort: true, // Adjust this based on your database configuration
      trustServerCertificate: true, // Set to true if using a self-signed certificate
      cryptoCredentialsDetails: {
        minVersion: "TLSv1"
      },
      connectionTimeout: 30000, // Increase connection timeout
      requestTimeout: 60000 // Increase request timeout
    }
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      console.log("Database connection established");
      done(null, conn);
    }
  },
  debug: true // Enable debug logging to troubleshoot SQL queries and connection issues
};

// If using a self-signed certificate, adjust the path accordingly
if (connString.connection.options.trustServerCertificate) {
  connString.connection.options.cryptoCredentialsDetails.certificate = fs.readFileSync(path.resolve(__dirname, './certificates/self-signed-cert.pem')); // Adjust the path accordingly
}

// Initialize knex
const knex = Knex(connString);

// Give the knex instance to objection
Model.knex(knex);

// Error handling for connection issues
knex.raw('SELECT 1')
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

module.exports = knex;
