/**
 * Vercel Serverless Function Entry Point
 *
 * This file imports the Express app from server.cjs and exports it
 * as a Vercel serverless function.
 */

const app = require('../server.cjs');

// Export for Vercel
module.exports = app;
