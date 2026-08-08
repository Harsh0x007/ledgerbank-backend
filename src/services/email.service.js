require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
})

// console.log(process.env.EMAIL_USER)
// console.log(process.env.CLIENT_ID)
// console.log(process.env.REFRESH_TOKEN)

transporter.verify((error, success) => {
    if (error) {
        console.error("Error connecting to email server:", error)
    } else {
        console.log('Email server is ready to send messages!')
    }
})



const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        })

        console.log("Message sent: %s", info.messageId)
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    } catch (err) {
        console.error('Error sending email:', err)
    }
}

async function sendRegisterationEmail(userEmail, name) {
    const subject = `Welcome to Backend Ledger!`
    const text = `Hello ${name},\n\nThank you for registering at Backend Ledger.
    We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p>Thank you for registering at Backend Ledger. We'rer excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html)

}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successfull'
    const text = `Hello ${name},\n\nYour transaction of Rs.${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`
    const html =  `<p>Hello ${name},</p><p>Your transaction of Rs.${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`

    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed'
    const text =  `Hello ${name},\n\nWe regret to inform you that your transaction of Rs.${amount} to account ${toAccount} was failed`
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of Rs.${amount} to account ${toAccount} was failed</p>`

    await sendEmail(userEmail, subject, text, html)
}


module.exports = { 
    sendRegisterationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
}
