const express = require('express')
const {authMiddleware} = require('../middleware/auth.middleware')
const accountController = require('../controllers/account.controller')


const router = express.Router()


/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post('/', authMiddleware, accountController.createAccountController)

/**
 * - Get /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware, accountController.getUserAccountsController)

/**
 * - Get /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware, accountController.getAccountBalanceController )

/**
 * - PATCH /api/accounts/:accountId/rename
 * - Rename an account
 * - Protected Route
 */
router.patch("/:accountId/rename", authMiddleware, accountController.renameAccountController)

/**
 * - PATCH /api/accounts/:accountId/close
 * - Close an account (soft-delete, requires zero balance)
 * - Protected Route
 */
router.patch("/:accountId/close", authMiddleware, accountController.closeAccountController)

module.exports = router