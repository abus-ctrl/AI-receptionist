# Wonderland External Integrations Guide

This document details the architecture, compliance, and setup requirements for external services: **UPI Payments Reconciliation** and **WhatsApp Business Cloud API**.

---

## 1. UPI Payment Reconciliation

### Zero-Cost Initial Release (Production Ready)
- Receptionists input the customer's payment method (Cash, UPI, Card) and the 12-digit UPI Reference Number / UTR (e.g. `429182910481`).
- The system prevents duplicate UTR entries across different invoices.
- Unmatched or doubtful payments enter the **Pending Reconciliation** queue for Owner verification.

### Enterprise / Automation Options
To achieve zero-touch bank reconciliation without SMS permission risks:

1. **Merchant Aggregator Webhooks (Razorpay / Cashfree / PhonePe Payment Gateway)**:
   - Configure a webhook endpoint `/api/webhooks/upi`.
   - Webhook payload provides: `transaction_id`, `amount`, `status: captured`, `reference_id`.
   - The server verifies HMAC-SHA256 signature and matches `reference_id` to the pending invoice.

2. **Bank Open API / Account Aggregator (Setu / Decentro)**:
   - Polling bank statement feeds directly via RBI-approved AA (Account Aggregator) framework.
   - Match transaction narration strings containing the customer's phone number or invoice number.

3. **Android Device Integration (SMS Ingestion)**:
   - *Architecture Note*: Browsers cannot read SMS directly due to W3C sandboxing and Android privacy controls.
   - If required, a lightweight companion APK running on the business reception Android phone can listen to `SMS_RECEIVED` events from bank sender IDs (e.g. `AXISBK`, `HDFCBK`) and push verified payload to the Wonderland webhook.
   - Cost: Free self-hosted Android service.

---

## 2. WhatsApp Business Cloud API Integration

### Objectives
- Send automatic session expiry reminders to customers playing long games.
- Send invoice PDF receipts directly to the customer's WhatsApp mobile.
- Dispatch daily revenue summary alerts to the Owner at business close.

### Architecture & Compliance
- Integrated through Meta Cloud API or BSP (Gupshup / Wati).
- Requires Meta Verified Business Account.
- Standard utility templates require pre-approval by Meta:
  - `session_reminder_due`: "Hello {{1}}, your session on {{2}} at Wonderland Arcade has ended. Please visit the front desk to extend or check out."
  - `receipt_issued`: "Hi {{1}}, thanks for visiting Wonderland! Your bill for ₹{{2}} (Invoice #{{3}}) has been generated."

### Non-Blocking Resilient Design
- WhatsApp dispatch is an asynchronous, non-blocking background task.
- If the WhatsApp service is down, unconfigured, or returns an error, the core front-desk timer, check-in, and invoice operations continue without interruption.
- Delivery status is logged in the `notifications` table (`PENDING`, `SENT`, `FAILED`, `DELIVERED`).
