const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")


async function createTransaction(req, res) {

    /**
     * 1. validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencykey are required"
        })
    }

const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!fromUserAccount) {
        return res.status(403).json({
            message: "Forbidden: fromAccount does not belong to you"
        })
    }

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }


    let transaction;
    const session = await mongoose.startSession()
    session.startTransaction()
    try{


    /**
     * 5. Create transaction(PENDING)
     */

    [transaction] = await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: 'DEBIT'
    }], { session })


    // await (()=> {
    //     return new Promise((resolve) => setTimeout(resolve, 30 * 1000))
    // })()

    const debitLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: 'CREDIT'
    }], { session })

    await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "COMPLETED" },
        { session }
    )

    await session.commitTransaction()
    session.endSession()
    } catch(error) {
        await session.abortTransaction()
        session.endSession()
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
            error: error.message
        })
    }

    /**
     * 10. Send email notification
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: " toAccount's, amount and idempotencykey are required "
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid, toAccount"
        })
    }

    const VAULT_ACCOUNT_ID = process.env.VAULT_ACCOUNT_ID || "6a771f3b1eb2357ca50e0241"

    const fromUserAccount = await accountModel.findOne({
        _id: VAULT_ACCOUNT_ID
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const vaultBalance = await fromUserAccount.getBalance()
    
    if (vaultBalance < amount) {
        return res.status(400).json({
            message: `Vault has insufficient reserve. Current reserve is ${vaultBalance}. Requested amount is ${amount}`
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const [transaction] = await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], {session})

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}

async function getAccountTransactions(req, res) {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const transactions = await transactionModel.find({
        $or: [{ fromAccount: accountId }, { toAccount: accountId }]
    }).sort({ createdAt: -1 })

    return res.status(200).json({
        transactions
    })
}

async function addMoneyController(req, res) {
    const { toAccount, amount, idempotencyKey, paymentMethod } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than zero"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
        user: req.user._id
    })

    if (!toUserAccount) {
        return res.status(403).json({
            message: "Forbidden: you can only add money to your own account"
        })
    }

    const VAULT_ACCOUNT_ID = process.env.VAULT_ACCOUNT_ID || "6a771f3b1eb2357ca50e0241"

    const vaultAccount = await accountModel.findOne({ _id: VAULT_ACCOUNT_ID })

    if (!vaultAccount) {
        return res.status(500).json({
            message: "Payment gateway is temporarily unavailable"
        })
    }

    const vaultBalance = await vaultAccount.getBalance()

    if (vaultBalance < amount) {
        return res.status(400).json({
            message: "Payment could not be processed. Please try again later"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const [transaction] = await transactionModel.create([{
        fromAccount: vaultAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session })

    await ledgerModel.create([{
        account: vaultAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: `₹${amount} added successfully via ${paymentMethod || "payment method"}`,
        transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getAccountTransactions,
    addMoneyController
}
