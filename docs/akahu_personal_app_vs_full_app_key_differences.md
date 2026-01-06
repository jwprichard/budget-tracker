# Akahu Personal App vs Full (Production) App

This document outlines the **key differences between Akahu Personal Apps and Full (Production) Apps**, with a focus on **capabilities, limitations, and design implications**. The goal is to help you design an application that can **start using Personal App endpoints** and later transition smoothly to **Full App endpoints**.

---

## 1. Purpose & Intended Use

### Personal App
- Designed for **individual use only** (your own accounts).
- Ideal for **prototyping, learning, and personal automation**.
- Not suitable for public, shared, or commercial applications.

### Full (Production) App
- Designed for **production use**.
- Supports **multiple users** authorising your application.
- Required for any public‑facing, SaaS, or commercial product.

---

## 2. User & Account Support

| Feature | Personal App | Full App |
|-------|--------------|----------|
| Supported users | 1 (yourself) | Unlimited |
| Multi‑tenant support | ❌ | ✅ |
| User authorisation flow | ❌ | ✅ (OAuth) |

**Key takeaway:** Personal apps cannot support other users. Full apps are required for any scenario where users connect their own bank accounts.

---

## 3. Authentication & Token Handling

### Personal App
- Tokens are generated manually in the Akahu dashboard.
- Uses a **static User Access Token** tied to your account.
- No OAuth redirect or consent flow.
- Simplified for local development and testing.

### Full App
- Uses a full **OAuth 2.0 authorisation flow**:
  - Redirect user to Akahu consent screen
  - User approves requested scopes
  - App receives authorisation code
  - Code exchanged for access and refresh tokens
- Requires secure token storage and refresh handling.

**Design implication:** Token management should be abstracted so static tokens can later be replaced with OAuth‑issued tokens.

---

## 4. Scopes & User Consent

| Capability | Personal App | Full App |
|-----------|--------------|----------|
| OAuth scopes | ❌ | ✅ |
| Granular permission control | ❌ | ✅ |
| User‑managed consent | ❌ | ✅ |

- Personal apps implicitly have broad access to your data.
- Full apps must explicitly request scopes such as `accounts`, `transactions`, or `payments`.

---

## 5. API Feature Availability

### Available in Both
- Accounts
- Balances
- Transactions
- Categories
- Connection status

### Personal App Limitations
- ❌ Webhooks
- ❌ Custom refresh scheduling
- ❌ Multiple concurrent users
- ❌ OAuth scopes & consent screens
- Limited payment limits (testing only)
- Manual refresh cooldowns enforced

### Full App Enhancements
- ✅ Webhooks (transaction updates, account changes)
- ✅ Configurable refresh cadence
- ✅ Production‑grade payment limits
- ✅ App‑scoped endpoints using Basic auth
- ✅ Multi‑user concurrency support

---

## 6. Payments

### Personal App
- Intended for testing only.
- Lower transaction and daily limits.
- Not suitable for real‑world payment workflows.

### Full App
- Production‑ready payments API.
- Higher configurable limits.
- Requires accreditation approval.

---

## 7. Refresh Behaviour

| Feature | Personal App | Full App |
|-------|--------------|----------|
| Automatic refresh | Daily | Configurable |
| Manual refresh | Limited | Configurable |
| Refresh policy control | ❌ | ✅ |

---

## 8. Webhooks & Eventing

### Personal App
- Webhooks are **not available**.
- Polling is required for updates.

### Full App
- Webhooks supported for:
  - New transactions
  - Account updates
  - Connection state changes
- Strongly recommended for real‑time or near‑real‑time apps.

---

## 9. Pricing

### Personal App
- Free.
- No usage‑based charges.

### Full App
- Paid model.
- Pricing typically based on **number of active users per month**.
- Rough guide: ~$0.50–$2.50 NZD per user per month (plan‑dependent).

---

## 10. Accreditation & Compliance

### Personal App
- No accreditation required.
- Immediate access after setup.

### Full App
- Accreditation required before production launch.
- Includes review of:
  - Security practices
  - Privacy policy
  - User consent flows
  - Token revocation handling
  - Data usage clarity

---

## 11. Design Guidance for a Future‑Proof App

To support both modes with minimal rework, design around these abstractions:

### Recommended Abstractions
- **Auth Provider** (static token → OAuth)
- **User Context** (single user → multi‑tenant)
- **Permission Model** (implicit → scoped)
- **Refresh Strategy** (polling → webhook‑driven)

### Suggested Migration Path
1. Start with a Personal App
2. Build core domain models (accounts, transactions, categories)
3. Abstract authentication and API access
4. Add OAuth and user tables later
5. Enable webhooks and background jobs

---

## 12. Summary Table

| Feature | Personal App | Full App |
|-------|--------------|----------|
| Multi‑user support | ❌ | ✅ |
| OAuth | ❌ | ✅ |
| Scopes & consent | ❌ | ✅ |
| Webhooks | ❌ | ✅ |
| Payments (production) | Limited | Full |
| Refresh control | ❌ | ✅ |
| Accreditation | ❌ | ✅ |
| Cost | Free | Paid |

---

## Final Notes

A **Personal App is ideal for early development**, learning the API, and building your budgeting logic. A **Full App is mandatory for production and real users**.

By designing your system with clear separation between **authentication**, **data access**, and **user context**, you can migrate from Personal App to Full App with minimal disruption.

