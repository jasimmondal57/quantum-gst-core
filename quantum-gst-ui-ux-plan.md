# Quantum GST --- UI/UX Design Plan

**Product:** Quantum GST\
**Platform:** Multi-tenant Indian GST SaaS\
**Technology:** React + TypeScript + Tailwind CSS + shadcn/ui\
**Design direction:** Modern, clean, colorful, trustworthy,
finance-focused\
**Document version:** 1.0

------------------------------------------------------------------------

## 1. Product experience vision

Quantum GST should feel like a modern financial workspace: clear enough
for a small retailer, powerful enough for an accountant, and structured
enough for an eCommerce business managing multiple GST registrations and
marketplaces.

### UX principles

1.  **Clarity before density** --- prioritize the next action and key
    financial numbers; keep advanced details one level deeper.
2.  **Color with purpose** --- use the brand palette to create
    recognition and guide attention, not to color every component.
3.  **Progressive disclosure** --- show essential fields first; reveal
    advanced GST and accounting fields when needed.
4.  **Fast repetitive work** --- searchable selectors, keyboard-friendly
    forms, saved filters, bulk actions and reusable templates.
5.  **Trust and traceability** --- clearly show document status, source,
    audit history, import errors and tax calculation details.
6.  **Responsive by design** --- desktop-first for accounting workflows,
    with usable tablet and mobile experiences for approvals and quick
    actions.
7.  **Accessible** --- WCAG 2.2 AA target, visible focus states,
    readable contrast, labels, keyboard navigation and non-color status
    indicators.

------------------------------------------------------------------------

## 2. Brand identity and color system

### Recommended brand direction

Use a confident **Quantum Blue + Electric Teal** identity. Blue
communicates reliability and financial trust; teal adds a modern
automation and technology feel. Use warm amber and coral only for
highlights and statuses.

### Core brand palette

  -----------------------------------------------------------------------
  Token                   Hex                     Usage
  ----------------------- ----------------------- -----------------------
  Brand 900               `#123B73`               Deep brand text, active
                                                  navigation

  Brand 700               `#1D5FBF`               Primary brand color

  Brand 600               `#2878E5`               Primary buttons and
                                                  links

  Brand 100               `#EAF2FF`               Selected surfaces and
                                                  soft highlights

  Teal 600                `#0D9F91`               Secondary actions,
                                                  automation, positive
                                                  emphasis

  Teal 100                `#E2F7F3`               Soft teal backgrounds

  Accent Amber            `#F2A93B`               Attention, pending
                                                  tasks, selected
                                                  highlights

  Accent Coral            `#E66B5B`               Destructive actions and
                                                  urgent warnings

  Success                 `#16865B`               Successful states

  Warning                 `#B7791F`               Warning states

  Danger                  `#C43D4B`               Errors and destructive
                                                  states

  Info                    `#2878E5`               Informational states
  -----------------------------------------------------------------------

### Neutral palette

  Token         Hex         Usage
  ------------- ----------- -----------------------------
  Neutral 950   `#172033`   Main text
  Neutral 700   `#46536A`   Secondary text
  Neutral 500   `#718096`   Muted labels
  Neutral 300   `#D8DFE9`   Borders
  Neutral 200   `#E8EDF4`   Dividers and subtle borders
  Neutral 100   `#F4F7FB`   App background
  White         `#FFFFFF`   Cards and main surfaces

### Color usage rules

-   Use Brand 600 for the main call-to-action on each screen.
-   Use Teal for automation, connected integrations and positive
    secondary emphasis.
-   Use Amber for pending review, attention required and incomplete
    setup.
-   Use Coral/Danger for errors, rejected records and destructive
    actions.
-   Never communicate status by color alone; always include text and,
    where useful, an icon.
-   Avoid large saturated background blocks. Keep most surfaces white or
    neutral.
-   Do not use gradients behind data tables or long-form forms. A subtle
    brand gradient may be used in the login illustration or onboarding
    header only.

### Suggested gradient

`linear-gradient(115deg, #1D5FBF 0%, #2878E5 55%, #0D9F91 100%)`

Use sparingly for the marketing hero, login side panel or a small
welcome banner---not for the entire dashboard.

------------------------------------------------------------------------

## 3. Typography, spacing and visual language

### Typography

-   Primary font: **Inter** or **Manrope**.
-   Use tabular numerals for currency, totals, quantities and dashboard
    metrics.
-   Page title: 24--28 px, semibold.
-   Section title: 16--18 px, semibold.
-   Body: 14--15 px.
-   Table text: 13--14 px.
-   Helper text: 12--13 px.
-   Avoid tiny text for GST values, tax rates and invoice totals.

### Layout system

-   Desktop content max width: 1600 px.
-   Sidebar: 248 px expanded, 76 px collapsed.
-   Top bar: 64 px.
-   Main page padding: 24 px desktop, 16 px tablet, 12--16 px mobile.
-   Card radius: 12--16 px.
-   Input height: 42--44 px.
-   Button height: 40--44 px.
-   Use a consistent 4 px spacing scale.
-   Use subtle borders and minimal shadows; avoid heavy glassmorphism.

### Iconography

Use Lucide icons consistently. Pair icons with labels in primary
navigation. Use icon-only controls only when the action is widely
understood and a tooltip is available.

------------------------------------------------------------------------

## 4. Application shell and navigation

### Desktop shell

**Left sidebar** - Quantum GST logo and workspace switcher. -
Dashboard. - Sales. - Purchases. - Products & Inventory. - Parties. -
Marketplace. - Reconciliation. - GST & Returns. - Accounting. -
Integrations. - Reports. - Settings.

**Top bar** - Current business and GSTIN selector. - Financial year /
reporting period selector where relevant. - Global search. -
Quick-create button. - Help centre. - Notifications. - User profile and
organization switcher.

### Sidebar behavior

-   Expand/collapse.
-   Group related modules.
-   Highlight active route with a pale Brand 100 background and Brand
    700 icon/text.
-   Show count badges only for actionable items, such as failed imports
    or pending approvals.
-   Keep labels visible on desktop; on mobile use a drawer navigation.

### Global quick-create menu

Provide shortcuts for: - New tax invoice. - New bill of supply. - New
credit note. - New customer. - New product. - Record payment. - Import
marketplace report.

------------------------------------------------------------------------

## 5. Information architecture and screen inventory

### Public website

1.  Home / product overview.
2.  Features.
3.  Marketplace integrations.
4.  Shopify integration.
5.  API for developers.
6.  Pricing.
7.  Security and compliance.
8.  Documentation.
9.  Login / sign up.

### Authentication and onboarding

1.  Sign in.
2.  Create account.
3.  Email / mobile verification.
4.  Create organization.
5.  Add business.
6.  Add GST registration or choose unregistered business profile.
7.  Set financial year and invoice preferences.
8.  Import customers/products (optional).
9.  Connect Shopify or marketplace (optional).
10. Guided first invoice.

Show onboarding progress and allow users to skip optional integration
steps and return later.

### Main application

  -----------------------------------------------------------------------
  Area                                Screens
  ----------------------------------- -----------------------------------
  Dashboard                           Overview, sales trends, GST
                                      snapshot, tasks

  Business                            Business profile, addresses, GST
                                      registrations, branches

  Sales                               Invoice list, create invoice,
                                      invoice detail, quotations, credit
                                      notes, debit notes

  Purchases                           Purchase bills, expenses, supplier
                                      credits

  Masters                             Customers, suppliers, products,
                                      HSN/SAC, units, tax categories

  Inventory                           Stock overview, stock movement,
                                      warehouses, adjustments

  Marketplace                         Connections, report upload, import
                                      history, mapping templates

  Reconciliation                      Orders vs invoices, returns, fees,
                                      TCS, settlements, exceptions

  GST                                 GSTR-1 preparation, GSTR-3B
                                      working, GSTR-2B import, ITC
                                      matching, HSN summary

  Accounting                          Chart of accounts, journal entries,
                                      ledgers, receivables, payables,
                                      bank

  Integrations                        Shopify, marketplace connectors,
                                      custom connectors, API keys,
                                      webhooks

  Reports                             Sales, purchase, tax, party,
                                      product, inventory and export
                                      reports

  Settings                            Users, roles, invoice templates,
                                      numbering, notifications,
                                      subscription
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 6. Dashboard UX

### Dashboard goals

The dashboard should answer these questions immediately:

-   How much did the business sell in the selected period?
-   How much GST was collected?
-   What is payable / available as eligible ITC according to the current
    working data?
-   What needs attention today?
-   Are marketplace imports and integrations healthy?

### Recommended layout

**Header** - "Good morning" greeting. - Business / GSTIN selector. -
Date range selector. - Primary action: `Create Invoice`.

**KPI row** 1. Sales value. 2. Purchase value. 3. Output GST. 4.
Eligible ITC working total. 5. Outstanding receivables.

**Main content** - Sales and purchase trend chart. - GST summary by tax
head. - Recent invoices. - Marketplace import status. - Integration
health. - Tasks requiring attention.

### Dashboard design rules

-   Each KPI card includes a clear label, value, comparison period and
    small context.
-   Make currency formatting consistent: `₹1,25,000.00`.
-   Never label a calculated or imported amount as "filed" or
    "confirmed" unless that status is supported by a filing
    acknowledgement.
-   Use "Working estimate", "Imported", "Reconciled" and "Filed" as
    distinct data states.
-   Clicking a KPI should open the corresponding filtered report.

------------------------------------------------------------------------

## 7. Billing and invoice creation UX

Invoice creation is the most important high-frequency workflow. Optimize
it for speed, accuracy and keyboard use.

### Recommended desktop layout

**Top section** - Document type. - Business / GSTIN. - Series and
invoice date. - Place of supply.

**Left / main column** - Customer selector and customer details. -
Product search and line-item grid. - Discount and additional charges. -
Notes and terms.

**Right / summary panel** - Taxable value. - CGST. - SGST / UTGST. -
IGST. - Cess. - Round-off. - Grand total. - Save draft / Preview /
Finalize actions.

### Line-item grid columns

  Column         Behavior
  -------------- --------------------------------------------------
  Item           Search product or enter description
  HSN/SAC        Prefilled from product; editable with permission
  Qty            Decimal quantity
  Unit           Unit selector
  Rate           Unit price
  Discount       Amount or percentage
  Tax category   Resolved tax profile
  Tax amount     Calculated, read-only by default
  Total          Calculated line total
  Actions        Remove / duplicate

### Invoice interactions

-   Search customers by name, phone or GSTIN.
-   Add a new customer in a side drawer without losing invoice progress.
-   Search products by name, SKU or barcode.
-   Support keyboard navigation between cells.
-   Auto-save draft with a visible saved state.
-   Display tax calculation explanation on demand.
-   Show validation errors beside the affected field and in a summary.
-   Warn about duplicate external references.
-   Confirm finalization with a clear summary of irreversible effects.
-   After finalization, show invoice number, PDF, share, payment and
    credit-note actions.

### Invoice detail page

Use a split layout: - Left: invoice preview. - Right: status timeline,
payment status, audit trail, customer communication and actions.

Do not allow silent editing of finalized financial documents. Route
corrections through permitted cancellation or credit/debit note
workflows.

------------------------------------------------------------------------

## 8. Marketplace import UX

Marketplace imports should feel like a guided wizard, not a generic file
upload form.

### Import wizard steps

1.  **Choose source** --- Amazon, Meesho, Flipkart, Meta/Facebook or
    Generic CSV/XLSX.
2.  **Choose report type** --- orders, sales, returns, settlement, fees,
    TCS or other supported report.
3.  **Upload file** --- drag-and-drop, browse, file format and size
    guidance.
4.  **Map columns** --- source column to Quantum GST field.
5.  **Preview** --- show first sample rows and detected data types.
6.  **Validate** --- show valid, warning, duplicate and failed counts.
7.  **Import** --- run in background with progress.
8.  **Results** --- imported records, skipped records, downloadable
    error file and next steps.

### Import status design

  -----------------------------------------------------------------------
  Status                  Label                   Meaning
  ----------------------- ----------------------- -----------------------
  Queued                  Waiting                 Import job is waiting

  Processing              Processing              File is being parsed

  Needs review            Action required         Mapping or validation
                                                  needs user input

  Completed               Completed               Import finished

  Completed with warnings Review recommended      Some records need
                                                  attention

  Failed                  Failed                  Import could not
                                                  complete
  -----------------------------------------------------------------------

### Import results screen

Display: - Total rows. - Imported. - Duplicates skipped. - Warnings. -
Failed rows. - Processing duration. - Source file and checksum. -
Mapping template used. - Reconciliation status.

Allow users to download failed rows with error descriptions and
reprocess only corrected records.

### Reusable mapping templates

Save a mapping template by: - Marketplace. - Report type. - Report
format version. - Organization. - Optional business / connection.

When a marketplace changes its export columns, show a "Format changed"
state and ask the user to review the mapping rather than silently
mapping incorrectly.

------------------------------------------------------------------------

## 9. Reconciliation UX

Create a reconciliation workspace with tabs:

1.  Orders vs invoices.
2.  Sales vs marketplace reports.
3.  Returns and refunds.
4.  Marketplace fees.
5.  GST TCS.
6.  Settlements.
7.  Exceptions.

### Reconciliation table

Recommended columns: - Source reference. - Order / invoice date. -
Marketplace order ID. - Invoice number. - Taxable value. - GST amount. -
Settlement amount. - Difference. - Match status. - Action.

### Match states

-   Matched.
-   Partially matched.
-   Unmatched.
-   Amount mismatch.
-   Missing invoice.
-   Duplicate.
-   Needs review.

Provide filters for date, marketplace, GSTIN, report type, status and
amount difference.

Use a side panel for comparing source and Quantum GST records. Do not
force users to navigate away from the reconciliation table to inspect a
mismatch.

------------------------------------------------------------------------

## 10. GST reports UX

### GST workspace

At the top: - GSTIN selector. - Return period. - Filing frequency /
applicable return context. - Last data refresh. - Preparation status.

### Report cards

-   GSTR-1 preparation.
-   GSTR-3B working.
-   GSTR-2B import and reconciliation.
-   HSN summary.
-   Sales register.
-   Purchase register.
-   ITC reconciliation.

### Report detail page

Use three sections:

1.  **Summary** --- totals and status.
2.  **Details** --- transaction-level records.
3.  **Validation** --- errors, warnings and suggested corrections.

### Filing state labels

Keep these states distinct: - Not prepared. - Draft. - Validation
required. - Ready for review. - Approved for submission. - Submitted. -
Filed. - Rejected / failed.

Only show "Filed" when a valid filing confirmation or acknowledgement
has been recorded. Provide a clear distinction between Quantum GST's
prepared report and data officially submitted to the GST system.

------------------------------------------------------------------------

## 11. Shopify and connector UX

### Integrations overview

Show integration cards for: - Shopify. - Amazon. - Meesho. - Flipkart. -
WooCommerce (future). - Custom API connector.

Each card should show: - Connected / disconnected. - Store name. - Last
successful sync. - Pending events. - Failed events. - Manage connection
action.

### Shopify setup wizard

1.  Connect Shopify store.
2.  Authorize requested permissions.
3.  Select Quantum GST business and GSTIN.
4.  Map Shopify products to HSN/SAC and tax categories.
5.  Choose invoice trigger.
6.  Configure customer and shipping address handling.
7.  Configure invoice series.
8.  Run a test order.
9.  Enable automation.

### Connection detail screen

Tabs: - Overview. - Order sync. - Product mapping. - Invoice rules. -
Webhooks. - Logs. - Settings.

Show webhook failures and retries in a readable event timeline. Allow
safe replay of failed events, with idempotency protection.

### Custom connector builder

Provide a developer-oriented configuration screen: - Connector name. -
Platform type. - Authentication method. - API base URL. - Endpoint
configuration. - Field mapping. - Event triggers. - Test connection. -
Test payload. - Activate connector.

For the first version, custom connectors should be configured by Quantum
GST administrators or developers. Do not expose an unrestricted code
editor to normal business users.

------------------------------------------------------------------------

## 12. Developer portal UX

The developer portal should feel like a professional API product.

### Navigation

-   Overview.
-   Quick start.
-   API reference.
-   API keys.
-   Webhooks.
-   Logs.
-   Usage.
-   Sandbox.
-   SDKs / examples.

### API key screen

-   Create sandbox key.
-   Create production key.
-   Show key prefix and creation date.
-   Copy secret once.
-   Revoke key.
-   Restrict key to selected business / GSTIN where appropriate.
-   Display last-used time.

### API documentation layout

Use a three-column layout on desktop: - Left: endpoint navigation. -
Center: endpoint documentation. - Right: request / response example.

Include: - Authentication. - Idempotency. - Pagination. - Rate limits. -
Error codes. - Webhook signatures. - Retry policy. - Sandbox examples.

------------------------------------------------------------------------

## 13. Tables, filters and data-heavy screens

GST software is table-heavy. Make tables readable and useful rather than
visually crowded.

### Table standards

-   Sticky table header.
-   Search and filters above the table.
-   Saved filter views.
-   Column visibility control.
-   Sortable columns.
-   Pagination with page-size selector.
-   Bulk actions only when safe.
-   Export to CSV/XLSX.
-   Right-aligned numeric values.
-   Tabular numerals for currency.
-   Clear empty, loading and error states.

### Filter design

Use a compact filter bar for common filters: - Date range. - GSTIN. -
Status. - Marketplace. - Customer / supplier.

Put advanced filters in a popover or side drawer.

### Empty states

Every empty state should explain: 1. Why the screen is empty. 2. What
action the user can take. 3. A clear primary action.

Example: "No marketplace reports imported yet. Upload an Amazon, Meesho
or Flipkart report to begin reconciliation."

------------------------------------------------------------------------

## 14. Notifications and task centre

Create a unified notification centre for: - Import completed. - Import
failed. - Shopify disconnected. - Webhook processing failed. - Invoice
PDF generated. - GST validation issue. - Return ready for review. -
Subscription or usage threshold reached.

Each notification should link directly to the relevant record or action.

Avoid excessive notifications for routine events. Allow users to
configure email and in-app preferences.

------------------------------------------------------------------------

## 15. Responsive behavior

### Desktop

-   Full sidebar.
-   Multi-column dashboards.
-   Full invoice line-item grid.
-   Advanced reconciliation workspace.

### Tablet

-   Collapsible sidebar.
-   Two-column dashboard.
-   Invoice summary as a sticky side panel where space permits.
-   Tables with controlled horizontal scrolling.

### Mobile

Prioritize: - Dashboard overview. - Invoice search and detail. - Quick
invoice creation. - Customer lookup. - Import progress. -
Notifications. - Approval and review actions.

Do not attempt to squeeze a large spreadsheet-style invoice grid onto a
narrow mobile screen. Use stacked line-item cards and a focused edit
drawer.

------------------------------------------------------------------------

## 16. Accessibility and usability requirements

-   WCAG 2.2 AA target.
-   Keyboard-operable navigation and dialogs.
-   Visible focus indicator.
-   Proper labels and error associations.
-   Accessible table headers.
-   Screen-reader announcements for import progress.
-   Do not use color as the only status indicator.
-   Support browser zoom to 200%.
-   Respect reduced-motion preferences.
-   Minimum comfortable touch target of approximately 44 × 44 CSS
    pixels.
-   Maintain sufficient contrast for text and controls.

------------------------------------------------------------------------

## 17. Design system component inventory

Build reusable components before implementing every screen.

### Foundation components

-   `AppShell`
-   `Sidebar`
-   `Topbar`
-   `PageHeader`
-   `Breadcrumbs`
-   `BusinessSwitcher`
-   `GstinSwitcher`
-   `DateRangePicker`

### Data components

-   `MetricCard`
-   `DataTable`
-   `FilterBar`
-   `SavedViews`
-   `StatusBadge`
-   `CurrencyText`
-   `TaxBreakdown`
-   `EmptyState`
-   `LoadingSkeleton`

### Form components

-   `GSTINInput`
-   `HSNInput`
-   `CustomerCombobox`
-   `ProductCombobox`
-   `AddressForm`
-   `TaxCategorySelect`
-   `InvoiceItemGrid`
-   `FileDropzone`
-   `ColumnMapper`

### Workflow components

-   `ImportWizard`
-   `ImportProgress`
-   `ValidationSummary`
-   `ReconciliationPanel`
-   `InvoicePreview`
-   `AuditTimeline`
-   `WebhookEventLog`

### Feedback components

-   Toasts.
-   Confirmation dialogs.
-   Inline validation.
-   Error summary.
-   Success state.
-   Warning banner.

------------------------------------------------------------------------

## 18. Recommended frontend implementation structure

``` text
frontend/
└── src/
    ├── app/
    │   ├── App.tsx
    │   ├── router.tsx
    │   └── providers/
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── data-display/
    │   ├── forms/
    │   └── feedback/
    ├── design-system/
    │   ├── tokens.css
    │   ├── typography.ts
    │   └── components/
    ├── modules/
    │   ├── dashboard/
    │   ├── billing/
    │   ├── purchases/
    │   ├── masters/
    │   ├── inventory/
    │   ├── marketplace/
    │   ├── reconciliation/
    │   ├── gst/
    │   ├── accounting/
    │   ├── integrations/
    │   ├── developer/
    │   └── settings/
    ├── services/
    ├── hooks/
    ├── stores/
    ├── types/
    └── utils/
```

### Example design tokens

``` css
:root {
  --brand-900: #123B73;
  --brand-700: #1D5FBF;
  --brand-600: #2878E5;
  --brand-100: #EAF2FF;

  --teal-600: #0D9F91;
  --teal-100: #E2F7F3;

  --accent-amber: #F2A93B;
  --accent-coral: #E66B5B;

  --success: #16865B;
  --warning: #B7791F;
  --danger: #C43D4B;
  --info: #2878E5;

  --text-primary: #172033;
  --text-secondary: #46536A;
  --text-muted: #718096;

  --border: #D8DFE9;
  --surface: #FFFFFF;
  --background: #F4F7FB;

  --radius-card: 14px;
  --radius-input: 9px;
}
```

------------------------------------------------------------------------

## 19. UI/UX development phases

  -----------------------------------------------------------------------
  Phase                               Deliverables
  ----------------------------------- -----------------------------------
  1\. Design foundation               Brand palette, typography, spacing,
                                      icons, components

  2\. Application shell               Sidebar, topbar, routing, business
                                      switcher

  3\. Core business                   Dashboard, masters, customer and
                                      product screens

  4\. Billing                         Invoice list, invoice editor,
                                      preview and detail

  5\. Marketplace                     Upload wizard, mapping, validation
                                      and import history

  6\. Reconciliation                  Matching workspace, exceptions and
                                      settlement details

  7\. GST                             Return preparation, tax reports and
                                      ITC matching

  8\. Integrations                    Shopify connection, connector
                                      settings and developer portal

  9\. Polish                          Responsive layouts, accessibility,
                                      empty states and usability tests
  -----------------------------------------------------------------------

### Suggested design acceptance criteria

-   A first-time user can complete onboarding without external
    assistance.
-   A regular user can create a standard invoice without navigating
    through unrelated screens.
-   A user can understand why a marketplace row failed validation.
-   A user can identify whether a GST report is prepared, reviewed,
    submitted or filed.
-   A user can find the last Shopify sync and inspect failed events.
-   Financial totals are visually prominent and consistently formatted.
-   No critical workflow relies on color alone.
-   All important screens have loading, empty, success and failure
    states.

------------------------------------------------------------------------

## 20. Recommended first UI/UX release scope

Prioritize these screens for the first working frontend:

  Priority   Screen                               Release
  ---------- ------------------------------------ ---------
  P0         Login and onboarding                 MVP
  P0         Main dashboard                       MVP
  P0         Business and GSTIN setup             MVP
  P0         Customers and products               MVP
  P0         Invoice list and invoice editor      MVP
  P0         Invoice preview and detail           MVP
  P0         Marketplace import wizard            MVP
  P0         Import history and error review      MVP
  P0         Shopify integration setup            MVP
  P0         Developer API keys and webhooks      MVP
  P1         Marketplace reconciliation           MVP
  P1         Sales and GST summary reports        MVP
  P1         GSTR-1 / GSTR-3B preparation views   MVP
  P2         Full accounting workspace            Later
  P2         Advanced inventory                   Later
  P2         GSP filing workflow                  Later
  P2         Advanced custom connector builder    Later

------------------------------------------------------------------------

## 21. Final design recommendation

The Quantum GST interface should be:

-   **Clean:** white cards, light neutral backgrounds and carefully
    structured spacing.
-   **Colorful:** recognizable blue and teal brand accents, with amber
    and coral used selectively.
-   **Professional:** precise typography, consistent financial
    formatting and clear status indicators.
-   **Fast:** quick-create actions, smart search, keyboard-friendly
    invoice entry and reusable import mappings.
-   **Trustworthy:** visible audit trails, clear GST calculation
    explanations and accurate filing statuses.
-   **Scalable:** a consistent design system that works across billing,
    marketplace imports, accounting and developer integrations.

**Recommended visual identity:** Quantum Blue `#2878E5` + Teal
`#0D9F91` + Cloud White `#FFFFFF` + Soft Background `#F4F7FB`.

The most important design priority is the invoice creation experience,
followed by marketplace imports and reconciliation. These three
workflows should receive the greatest attention during the first design
and usability cycle.
