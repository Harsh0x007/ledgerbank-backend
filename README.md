# LedgerBank — Backend

A REST API for a ledger-based banking application. Implements JWT authentication, a double-entry transaction ledger, multi-account support, idempotent transfers, and a simulated payment gateway for adding funds.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (cookie + bearer token support)
- bcrypt for password hashing
- Nodemailer (Gmail OAuth2) for transaction email notifications

## Setup

1. Clone the repo and install dependencies:
- npm install

2. Create a `.env` file in the root with the following variables:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_gmail_address
CLIENT_URL=http://localhost:5173

3. **Seed the vault account** (required before any transactions can be funded):
- npm run seed (node seed.js)
   This creates a system "vault" account with a starting reserve of ₹10,00,000, used to fund user accounts via the "Add Money" feature. Safe to re-run — it won't create duplicates.

4. Start the dev server:
- npm run dev