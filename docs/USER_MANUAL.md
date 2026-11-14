# Dairy Farm ERP - Comprehensive User Manual & Operations Guide

## 1. Introduction & Overview
Welcome to the **Dairy Farm ERP**, a comprehensive, offline-first farm management system designed specifically for modern dairy operations. This system allows you to manage every aspect of your farm, from individual animal tracking and milk production to financial ledgers, inventory, and worker management. 

Because this system is offline-ready, all your data is stored locally in a highly secure SQLite database (`farm.db`). You do not need an active internet connection for daily operations, ensuring zero downtime and complete data privacy.

---

## 2. Getting Started & System Access

### 2.1 Starting the System
To start the ERP:
1. Navigate to your project folder (`c:\Users\Seefoo Sial\Downloads\dairy-farm-erp---offline-ready-farm-management-system`).
2. Double-click the **`start-server.bat`** file.
3. A command prompt window will open, initializing the database and starting the backend server. **Do not close this black window while using the software.**
4. Open your web browser (Chrome, Edge, or Firefox) and navigate to: `http://localhost:3001`

### 2.2 First-Time Setup Workflow
When starting fresh, follow this exact sequence to populate your farm:
1. **Settings**: Define your farm name and basic parameters.
2. **Inventory**: Add initial feed stock and medicines.
3. **Animals**: Add your existing female cows and male animals.
4. **Customers**: Add milk buyers and contractors.
5. **Workers**: Add your farm labor force.

---

## 3. The Dashboard (Home)
The Dashboard provides a bird's-eye view of your farm's health and financials.

### Key Metrics
* **Herd Statistics**: Total active animals, milking vs. dry cows, pregnant animals.
* **Financial Summary**: Total revenue, expenses, and net profit for the selected period (Today, 7 Days, 30 Days).
* **Pending Tasks**: Automated reminders (e.g., cow is due for pregnancy test, vaccination due).
* **Health Alerts**: Quick links to open medical cases requiring attention.

*Pro Tip: Use the Quick Add button (`+`) on the top right to instantly log milk, feed, or expenses without navigating away from the dashboard.*

---

## 4. Herd Management (Core Operations)

### 4.1 Female Cows / Animals
This is your primary registry for all milking, dry, and pregnant females, as well as female calves.

**How to add a Cow:**
1. Click **Add Female Animal**.
2. **Required Fields**:
   * **Animal ID**: A unique identifier (e.g., C-001).
   * **DOB**: Date of birth (estimates age automatically).
3. **Important Fields**:
   * **Group**: (e.g., High Yield, Low Yield, Dry). This helps in batch feeding.
   * **Stage**: Calf, Heifer, or Adult.
   * **Reproductive Status**: Open, Inseminated, Pregnant, or Milking.
   * **Milk Status**: Milking or Dry.
4. **Bulk Actions**: Select multiple cows using checkboxes to move them between groups simultaneously.
5. **End of Lifecycle**: Use the `$` icon to mark an animal as **Sold** (recording buyer and price) or the broken heart icon to mark as **Deceased** (recording reason).

### 4.2 All Cow Profiles (Visual Grid)
A highly visual, card-based interface for quickly scanning your herd.
* **Cow Cards**: Displays ID, breed, status, and a small profile picture.
* **Profile Drawer**: Clicking a card opens a detailed side-panel.
* **Data in Profile**:
  * **Milk Sparkline**: A 14-day trend graph of the cow's individual milk production.
  * **Health History**: Past illnesses and treatments.
  * **Breeding History**: AI records and calving dates.
  * **Timeline**: An automated audit trail of status changes.

### 4.3 Male Animals
Registry for breeding bulls or male calves intended for fattening/sale.
* Kept separate from the female herd to avoid skewing milking statistics.
* Includes fields for purchase price and sale price for easy profitability tracking per bull.

### 4.4 Breeding & Calves
Manage Artificial Insemination (AI), natural mating, and calving events.

**Workflow:**
1. **Record Breeding**: Select the cow, enter the date, method (AI/Natural), and Sire ID (Bull's ID or Semen batch).
2. **Pregnancy Check (PD)**: After 45-60 days, update the record with the result (Pregnant / Open).
3. **Calving**: When the cow gives birth, update the record with the Calf ID, sex, and calving ease. This automatically resets the cow's reproductive cycle.

### 4.5 Health & Vet
Log medical treatments and veterinary visits.
* **Add Case**: Select the animal, enter the diagnosis, prescribed treatment, and cost.
* **Status**: Keep cases as "Open" while treatment is ongoing. Mark as "Resolved" when the animal recovers.
* *Note: Health costs entered here should also be manually added to Expenses if they represent cash out, or linked through Inventory if using stocked medicines.*

### 4.6 Vaccination Schedule
Preventative herd care management.
* **Schedule Batch Vaccination**: Select a vaccine type (e.g., FMD, HS), set a date, and select which groups of animals receive it.
* The system will track which animals are due for boosters.

---

## 5. Daily Operations (Data Entry)

### 5.1 Milk Production
Track daily yield. The system supports two modes:

**Mode A: Total Milk (Bulk)**
Used when you only measure the bulk tank yield.
1. Enter Date and Shift (Morning/Evening).
2. Enter total litres produced.
3. Enter Fat% and SNF% (optional, useful for commercial billing).

**Mode B: Individual Milk (Detailed)**
Used for precise tracking and identifying low-yielders.
1. Click the "Lock/Unlock" icon on a Total entry to open the Individual Milk Modal.
2. The system lists all cows currently marked as `milkStatus: Milking`.
3. Enter litres for each cow. The system automatically sums them up to ensure it matches your Bulk Total.

### 5.2 Daily Feed
Track consumption of fodder, silage, and concentrates.
* **Record Feed**: Select Date, Feed Type, Quantity (in Maunds or KG), and Cost.
* **Impact**: Helps calculate the daily cost of feeding vs. daily milk revenue to determine profitability.

### 5.3 Inventory & Stock
Manage warehouse items.
* **Items**: Create items (e.g., "Wanda", "Silage", "Oxytetracycline").
* **Transactions**: Record `IN` (purchases) and `OUT` (consumption).
* Ensure you regularly update stock so the system can calculate accurate holding costs.

---

## 6. Sales, Finance, & Workforce

### 6.1 Milk Sales & Deliveries
Manage daily milk distribution.
1. **Set Rates**: Ensure each Customer has an agreed rate per litre in the Customers tab.
2. **Add Delivery**: Select Date, Shift, Customer, and Litres delivered. The system calculates the total amount.
3. **Invoicing**: Deliveries accumulate into a receivable balance for the customer.

### 6.2 Customers & Receivables
Track who owes you money.
* **Ledger**: View total milk delivered vs. payments received.
* **Receive Payment**: When a customer pays, log the payment here to reduce their outstanding balance.

### 6.3 Expenses (Cash Out)
Track all farm overheads.
* **Categories**: Maintenance, Electricity, Diesel, Salaries, Vet Fees.
* **Record Expense**: Enter Date, Category, Amount, and specific notes.

### 6.4 Workers & Advances
Manage labor costs.
* **Add Worker**: Name, Role, Base Salary.
* **Transactions**: Record Advance Payments (loans) or Salary Payments. 
* The ledger automatically tracks if a worker owes you money or if their salary is pending.

---

## 7. Reporting & Analytics

### 7.1 Reports Page
The central hub for data analysis.
* **Financial P&L**: Select a date range to see Total Revenue (Milk + Animal Sales) minus Total Expenses (Feed + Overhead + Salaries).
* **Milk Trends**: Visual charts showing production stability.
* **Print/Export**: Use browser print (`Ctrl+P`) to generate PDF reports for investors or stakeholders.

---

## 8. Best Practices for Production Use

To get the most out of this ERP, establish a strict daily routine:

**Daily Routine (Morning & Evening):**
1. Record Milk Totals (and individual yields if applicable).
2. Record Milk Deliveries to customers.
3. Log daily Feed consumption.

**Weekly Routine:**
1. Update Health and Breeding records.
2. Clear pending automated tasks in the Reminders tab.
3. Log miscellaneous weekly expenses (e.g., diesel).

**Monthly Routine:**
1. Process Worker salaries and reconcile advances.
2. Receive bulk payments from milk contractors.
3. Review the Financial Report (P&L) to analyze profitability.
4. Take a backup of your `farm.db` file (copy it to a USB drive or cloud storage).

---

## 9. Troubleshooting & Technical Data
* **Data Not Saving?** Ensure the `start-server.bat` window is open. The web interface cannot save data if the backend server is closed.
* **Database Location**: All data is stored in `farm.db` in your project folder. **Never delete this file unless you want to wipe all data.**
* **Port Conflicts**: If the app fails to start, ensure no other programs are using port 3001 or 5173.

***End of Document***
