# Harbour Side Rental Admin & Quote System Requirements

## Project Overview

Build a backend and admin dashboard for a vacation rental property website.

The system must allow the property owner/admin to manage rental rates, seasonal pricing, taxes, fees, rental policies, and booking availability through an admin dashboard. The public website/frontend must be able to fetch availability, rates, and accurate booking quotes through API endpoints.

The main goal is to make quote calculation reliable and consistent with the rates, fees, taxes, and calendar data managed by the admin.

## Primary Users

### Admin / Property Owner

The admin uses a protected dashboard to:

- Log in securely.
- Manage regular/default rental pricing.
- Manage seasonal pricing.
- Configure weekend pricing rules.
- Configure minimum stay rules.
- Configure cleaning, pet, extra guest, tax, and damage deposit settings.
- Add rental notes and cancellation policies.
- Save and sync an external iCal calendar feed.
- View current availability in a calendar.

### Public Website Visitor

The public visitor uses the frontend website to:

- Select check-in and check-out dates.
- Enter guests and pets.
- View available dates.
- Request an accurate quote.
- See the final price breakdown.

## Technology Requirements

The current project uses:

- Node.js
- Express
- EJS for admin views
- Sequelize ORM
- MySQL
- Express sessions for admin authentication
- Public REST APIs for frontend integration
- iCal sync for external bookings

The implementation should stay consistent with this stack unless otherwise requested.

## Admin Authentication

### Requirements

- Admin must log in before accessing the dashboard.
- Dashboard routes must be protected.
- Public API routes must not require admin login.
- Invalid login should show a clear error.
- Logout should destroy the admin session.

### Routes

```txt
GET /
POST /login
GET /logout
```

## Admin Dashboard

### Dashboard Route

```txt
GET /dashboard
```

The dashboard must include these sections:

- Rates
- Taxes & Fees
- Calendar
- Policies & Rental Notes

The dashboard should be clean, consistent, and easy for a non-technical admin to use.

## Rates Management

The system must support two types of rates:

1. Regular / Default Rate
2. Seasonal Rates

### Regular / Default Rate

The default rate is the fallback rate used when no seasonal rate applies.

Requirements:

- Admin can create or update the default rate.
- Default rate has no start date and no end date.
- Default rate should use season name `Standard`.
- Default rate should not be deleted accidentally.
- If no default rate exists, seasonal-only quotes should still work if the full stay is covered by seasonal rates.
- If a quote includes a date not covered by a seasonal rate and no default rate exists, the API must return a clear error.

Default rate fields:

- Nightly rate
- Weekend rate
- Weekend days
- Minimum stay

### Seasonal Rates

Seasonal rates override the default rate for specific date ranges.

Requirements:

- Admin can create, edit, and delete seasonal rates.
- Seasonal rates must have both start and end dates.
- End date must be after start date.
- Seasonal rate dates must be treated as checkout-style ranges.
- Start date is included.
- End date is excluded.

Example:

```txt
Seasonal rate: June 21, 2026 to June 30, 2026
Applies to nights: June 21 through June 29
Does not apply to night: June 30
```

Seasonal rate fields:

- Season name
- Start date
- End date
- Nightly rate
- Weekend rate
- Weekend days
- Minimum stay

### Weekend Pricing

Each rate must allow selecting weekend days.

Examples:

```txt
Fri,Sat
Sat,Sun
Thu,Fri,Sat,Sun
```

For each booked night:

- If the night falls on a selected weekend day, use weekend rate.
- Otherwise use nightly rate.

### Minimum Stay

Each rate has a minimum stay value.

Requirements:

- Minimum stay must be at least 1.
- If a booking touches multiple rates, use the highest minimum stay among the booked nights.
- If total nights is below the required minimum, quote API must return a clear error.

### Rate Validation

The system must prevent invalid rate data:

- Negative nightly rates are not allowed.
- Negative weekend rates are not allowed.
- Minimum stay less than 1 is not allowed.
- Seasonal rate must have a valid start and end date.
- Seasonal end date must be after seasonal start date.

## Taxes & Fees Management

Admin must be able to configure all taxes and fees from the dashboard.

### Cleaning Fee

Fields:

- Cleaning fee amount
- Fee type:
  - Per Stay
  - Per Night
- Taxable:
  - Yes
  - No

Logic:

- Per Stay applies once per booking.
- Per Night multiplies by total nights.
- Tax applies only if marked taxable.

### Pet Fee

Fields:

- Pet fee amount
- Fee type:
  - Per Stay
  - Per Night
- Taxable:
  - Yes
  - No

Logic:

- If pet count is 0, pet fee is 0.
- Per Stay multiplies fee by number of pets.
- Per Night multiplies fee by pets and total nights.
- Tax applies only if marked taxable.

### Extra Guest Fee

Fields:

- Extra guest fee amount
- Fee type:
  - Per Guest Per Stay
  - Per Guest Per Night
- Extra guest threshold
- Taxable:
  - Yes
  - No

Logic:

- If paying guests are greater than threshold, extra guest fee applies.
- Extra guests = paying guests - threshold.
- Per Guest Per Stay multiplies fee by extra guests.
- Per Guest Per Night multiplies fee by extra guests and total nights.
- Tax applies only if marked taxable.

### Property Tax

Fields:

- Property tax rate as percentage

Logic:

- Accommodation is always taxable.
- Cleaning fee is taxable only if enabled.
- Pet fee is taxable only if enabled.
- Extra guest fee is taxable only if enabled.
- Damage deposit is not taxable.

### Damage Deposit

Fields:

- Refundable damage deposit amount

Logic:

- Damage deposit is included in grand total.
- Damage deposit is not taxable.

### Fee Validation

The system must prevent negative values for:

- Cleaning fee
- Pet fee
- Extra guest fee
- Extra guest threshold
- Damage deposit
- Property tax rate

## Policies & Rental Notes

Admin must be able to save:

- Additional information about rental rates
- Rental policies / cancellation policy

These policies should be available to the frontend through the quote response so they can be displayed to the visitor.

## Calendar / iCal Sync

The admin must be able to save an external iCal URL from platforms like VRBO or Airbnb.

### Admin Requirements

- Admin can save iCal URL.
- Admin can manually sync calendar.
- Dashboard calendar must show booked dates.
- Dashboard calendar must clearly show:
  - Today
  - Check-in dates
  - Booked nights
  - Check-out dates

### Public Requirements

The frontend must be able to fetch booked dates.

Endpoint:

```txt
GET /api/booked-dates
```

Response shape:

```json
{
  "success": true,
  "data": {
    "bookedDates": [],
    "startDates": [],
    "endDates": []
  }
}
```

### Calendar Date Logic

- Check-in date is the first booked date.
- Check-out date is not booked for the departing guest.
- Check-out date should be available as a new check-in date.
- Booked dates are all nights from check-in up to, but not including, check-out.

## Public API Requirements

The frontend must be able to use public API endpoints without admin authentication.

### Get Rates

Endpoint:

```txt
GET /api/rates
```

Response must separate default rate from seasonal rates.

Example:

```json
{
  "success": true,
  "default_rate": {
    "id": 1,
    "season_name": "Standard",
    "start_date": null,
    "end_date": null,
    "nightly_price": 399,
    "weekend_price": 499,
    "weekend_days": "Sat,Sun",
    "min_stay": 1,
    "weekly_price": null,
    "monthly_price": null
  },
  "seasonal_rates": [
    {
      "id": 6,
      "season_name": "2026",
      "start_date": "2026-05-19",
      "end_date": "2026-12-31",
      "nightly_price": 399,
      "weekend_price": 499,
      "weekend_days": "Sat,Sun",
      "min_stay": 1,
      "weekly_price": 2563.91,
      "monthly_price": 12392.24
    }
  ]
}
```

If no default rate exists:

```json
{
  "success": true,
  "default_rate": null,
  "seasonal_rates": []
}
```

### Get Quote

Endpoint:

```txt
POST /api/quote
```

The quote endpoint must calculate the full booking quote.

Accepted date formats:

```txt
YYYY-MM-DD
MM/DD/YY
MM/DD/YYYY
```

Accepted request examples:

```json
{
  "checkIn": "06/21/26",
  "checkOut": "06/30/26",
  "guests": 3,
  "pets": 0
}
```

```json
{
  "check_in": "2026-06-21",
  "check_out": "2026-06-30",
  "adults": 2,
  "children": 1,
  "infants": 1,
  "pet_count": 0
}
```

Supported field names:

Dates:

- `checkIn`
- `check_in`
- `startDate`
- `start_date`
- `checkOut`
- `check_out`
- `endDate`
- `end_date`

Guests:

- `guests`
- `totalGuests`
- `total_guests`
- `adults`
- `adultCount`
- `adult_count`
- `children`
- `childCount`
- `child_count`
- `infants`
- `infantCount`
- `infant_count`

Pets:

- `pets`
- `petCount`
- `pet_count`

### Guest Logic

- If `guests` is provided, use it as the paying guest count.
- If `guests` is not provided, paying guests = adults + children.
- Infants do not count as paying guests.
- At least one paying guest is required.
- Guest, adult, child, infant, and pet counts must be whole numbers greater than or equal to 0.

### Quote Response

Successful response:

```json
{
  "success": true,
  "quote": {
    "checkIn": "2026-06-21",
    "checkOut": "2026-06-30",
    "totalNights": 9,
    "guests": 3,
    "adults": 2,
    "children": 1,
    "infants": 1,
    "pets": 0,
    "minStayRequired": 1,
    "breakdown": {
      "accommodation": 3891,
      "cleaningFee": 200,
      "petFee": 0,
      "extraGuestFee": 0,
      "tax": 531.83,
      "damageDeposit": 0
    },
    "nightlyRates": [
      {
        "date": "2026-06-21",
        "rateId": 6,
        "seasonName": "2026",
        "dayName": "Sun",
        "isWeekend": true,
        "amount": 499
      }
    ],
    "policies": {
      "rentalNotes": null,
      "cancellationPolicy": null
    },
    "grandTotal": 4622.83
  }
}
```

### Quote Errors

The API must return clear errors for invalid quote requests.

Examples:

Invalid date format:

```json
{
  "success": false,
  "error": "Check-in date must be in YYYY-MM-DD or MM/DD/YY format."
}
```

Past check-in:

```json
{
  "success": false,
  "error": "Check-in date cannot be in the past."
}
```

Checkout before check-in:

```json
{
  "success": false,
  "error": "Check-out must be after check-in."
}
```

No rate configured:

```json
{
  "success": false,
  "error": "No rate configured for 2026-06-21. Add a seasonal rate for this date or configure the Regular / Default Price."
}
```

Minimum stay not met:

```json
{
  "success": false,
  "error": "This stay requires at least 3 nights."
}
```

## Quote Calculation Rules

The quote calculation must follow this order:

1. Normalize input.
2. Validate dates.
3. Validate guest and pet counts.
4. Count total nights.
5. Load settings.
6. Load rates.
7. Price each night.
8. Enforce minimum stay.
9. Calculate cleaning fee.
10. Calculate pet fee.
11. Calculate extra guest fee.
12. Calculate taxable amount.
13. Calculate tax.
14. Add damage deposit.
15. Return itemized quote.

### Nightly Pricing Rules

For each booked night:

1. Check if a seasonal rate applies.
2. If yes, use seasonal rate.
3. If no, use default rate.
4. If no default rate exists, return a date-specific error.
5. Check whether that night is a configured weekend day.
6. Use weekend price or nightly price accordingly.

### Overlapping Seasonal Rates

If multiple seasonal rates match the same night:

- The more specific/shorter seasonal date range should win.
- If still tied, newer/later-created rate should win.

## Admin UI Requirements

The dashboard should be easy to understand.

### Rates Tab

Must include:

- Price Type dropdown:
  - Seasonal Price
  - Regular / Default Price
- Seasonal rate form
- Default rate form
- Current seasonal rates table
- Edit seasonal rate button
- Delete seasonal rate button

### Taxes Tab

Must include:

- Extra guest fee settings
- Cleaning fee settings
- Pet fee settings
- Damage deposit
- Tax rate
- Rental notes
- Cancellation policy

### Calendar Tab

Must include:

- iCal URL input
- Save URL button
- Sync Now button
- Two-month calendar view
- Legend for today/check-in/booked/check-out

## Data Validation Requirements

The backend must validate data even if the frontend already validates it.

Required backend validations:

- Dates must be valid.
- Check-out must be after check-in.
- Check-in cannot be in the past for quotes.
- Prices and fees must not be negative.
- Minimum stay must be at least 1.
- Guest and pet counts must be whole numbers.
- At least one paying guest is required.
- Seasonal rate must have both start and end dates.
- Seasonal rate end date must be after start date.

## Acceptance Criteria

The project is considered working when:

1. Admin can log in and access dashboard.
2. Admin can create/update default rate.
3. Admin can create/edit/delete seasonal rates.
4. Admin can configure taxes and fees.
5. Admin can save policies.
6. Admin can save and sync iCal URL.
7. Public frontend can fetch rates.
8. Public frontend can fetch booked dates.
9. Public frontend can request quotes.
10. Quote API returns correct totals and itemized breakdown.
11. Quote API handles both `YYYY-MM-DD` and `MM/DD/YY` dates.
12. Seasonal-only quotes work when dates are fully covered.
13. Missing rate dates return clear errors.
14. Checkout date is not charged.
15. Dashboard UI and API logic use the same business rules.

## Example Business Case

Current known data example:

```txt
Season: 2026
Start: 2026-05-19
End: 2026-12-31
Nightly rate: 399
Weekend rate: 499
Weekend days: Sat,Sun
Cleaning fee: 200 per stay
Tax rate: 13%
```

Quote request:

```json
{
  "checkIn": "06/21/26",
  "checkOut": "06/30/26",
  "guests": 1,
  "pets": 0
}
```

Expected interpretation:

```txt
Check-in: 2026-06-21
Check-out: 2026-06-30
Charged nights: 9
Nights charged: June 21 through June 29
```

Expected pricing:

```txt
Accommodation: 3891
Cleaning fee: 200
Tax: 531.83
Grand total: 4622.83
```

## Developer Notes

Important files:

- `src/services/quote.service.js`
  - Main quote calculation logic.

- `src/services/rate.service.js`
  - Rate validation, create, update, delete logic.

- `src/controllers/dashboard.controller.js`
  - Admin dashboard form handling.

- `src/controllers/api.controller.js`
  - Public rates API.

- `src/controllers/quote.controller.js`
  - Public quote API.

- `src/views/dashboard.ejs`
  - Admin dashboard markup.

- `public/js/dashboard.js`
  - Dashboard tab, form, delete, sync, and calendar behavior.

- `src/services/ical.service.js`
  - iCal fetch and booked date generation.

## Non-Goals For Current Scope

These are not required unless separately requested:

- Online payment processing.
- Booking creation.
- Guest account system.
- Email notifications.
- Multiple property support.
- Admin role permissions.
- Coupon or discount system.
- Full CMS for public website pages.

