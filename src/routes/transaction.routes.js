const express = require('express')
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require('../controllers/transaction.controller')

const transactionRoutes = express.Router()

/**
 * - POST /api/transactions/
 * - create a new transactions
 */

transactionRoutes.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - POST /api/transactions/system/initialize-funds
 * - Create initial funds transaction from system user 
 */

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

/**
 * - GET /api/transactions/account/:accountId
 * - Get all transactions for a specific account
 */

transactionRoutes.get("/account/:accountId", authMiddleware.authMiddleware, transactionController.getAccountTransactions)

/**
 * - POST /api/transactions/add-money
 * - Simulated payment gateway: user adds money to their own account
 * - Protected Route (regular user)
 */

transactionRoutes.post("/add-money", authMiddleware.authMiddleware, transactionController.addMoneyController)

module.exports = transactionRoutes;