# Payment Status Reference

This document lists all payment statuses used in the CodeFix payment system.

## Internal Payment Statuses

The system uses 5 main payment statuses:

### 1. **Pending** 🟡
- **Display Name**: "Pending"
- **Color**: Yellow/Amber (#fbbf24)
- **Description**: Payment has been created but not yet completed
- **Visual Indicator**: Yellow badge with pulsing dot animation
- **Actions Available**:
  - ✅ Check Status
  - ✅ Cancel Payment (Admin only)
  - ✅ View Details
- **API Status Mappings**:
  - `pending`
  - `active`
  - `created`
  - `waiting`

### 2. **Paid** 🟢
- **Display Name**: "Paid"
- **Color**: Green (#10b981)
- **Description**: Payment has been successfully completed
- **Visual Indicator**: Green badge with static dot
- **Actions Available**:
  - ✅ View Details
  - ❌ Cannot cancel (already paid)
- **API Status Mappings**:
  - `paid`
  - `completed`
  - `success`
  - `successful`
  - `confirmed`

### 3. **Declined** 🔴
- **Display Name**: "Declined"
- **Color**: Red (#ef4444)
- **Description**: Payment was rejected or failed
- **Visual Indicator**: Red badge with static dot
- **Actions Available**:
  - ✅ View Details
  - ❌ Cannot cancel (already declined)
- **API Status Mappings**:
  - `declined`
  - `rejected`
  - `failed`

### 4. **Expired** 🔴
- **Display Name**: "Expired"
- **Color**: Red (#ef4444)
- **Description**: Payment has expired and is no longer valid
- **Visual Indicator**: Red badge with static dot
- **Actions Available**:
  - ✅ View Details
  - ❌ Cannot cancel (already expired)
- **API Status Mappings**:
  - `expired`
  - `expire`
  - `timeout`

### 5. **Cancelled** 🔴
- **Display Name**: "Cancelled"
- **Color**: Red (#ef4444)
- **Description**: Payment was cancelled by an admin
- **Visual Indicator**: Red badge with static dot
- **Actions Available**:
  - ✅ View Details
  - ❌ Cannot cancel (already cancelled)
- **API Status Mappings**:
  - `cancelled`
  - `canceled` (US spelling)
  - `cancel`

## Status Type Definition

```typescript
type PaymentStatus = 'pending' | 'paid' | 'declined' | 'expired' | 'cancelled'
```

## Status Normalization

The system automatically normalizes various API status values to the internal status types. Unknown statuses default to `pending` and log a warning.

## Status Flow

```
Created → Pending → [Paid | Declined | Expired | Cancelled]
```

## Visual Indicators

- **Pending**: Yellow badge with animated pulsing dot
- **Paid**: Green badge with static dot
- **Declined/Expired/Cancelled**: Red badge with static dot

## Status Badge Classes

- `.badge-pending` - Yellow background
- `.badge-paid` - Green background
- `.badge-declined` - Red background (also used for expired/cancelled)

## Payment History

All payment statuses are tracked in the payment history table (admin only), showing:
- Payment ID
- Amount
- Status (with color-coded badge)
- Created date
- Paid date (if applicable)
- Available actions

