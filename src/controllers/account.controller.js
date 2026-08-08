const accountModel = require("../models/account.model")

/**
 * 
 */

async function createAccountController(req, res) {

    const user = req.user;
    const { accountType, name } = req.body;

    const account = await accountModel.create({
        user: user._id,
        accountType: accountType || "SAVINGS",
        name: name?.trim() || `${accountType || "SAVINGS"} Account`
    })

    res.status(201).json({
        account
    })
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({user: req.user._id })

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if(!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();
    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}

async function renameAccountController(req, res) {
    const { accountId } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: "Name is required"
        })
    }

    const account = await accountModel.findOneAndUpdate(
        { _id: accountId, user: req.user._id },
        { name: name.trim() },
        { new: true }
    )

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    res.status(200).json({
        account
    })
}

async function closeAccountController(req, res) {
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

    const balance = await account.getBalance()

    if (balance !== 0) {
        return res.status(400).json({
            message: `Account must have a zero balance to close. Current balance is ${balance}`
        })
    }

    account.status = "CLOSED"
    await account.save()

    res.status(200).json({
        message: "Account closed successfully",
        account
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    renameAccountController,
    closeAccountController
}