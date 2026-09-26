# Dairy Farm ERP - Offline-Ready Farm Management System

This is a comprehensive, offline-ready Dairy Farm Management System (ERP). It provides a complete solution for managing animals, milk records, health, expenses, customers, and more, all with seamless offline support.

## ?? How to Run the Project

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Step 1: Install Dependencies
Open your terminal (Command Prompt, PowerShell, or Bash) in the project directory and run:
`ash
npm install
``n
### Step 2: Start the Backend Server and Frontend
Run the following command to start both the backend API and the Vite frontend development server:
`ash
npm run dev
``nAlternatively, if you want to run the production build server, you can use:
`ash
npx tsx server.ts
``n
### Step 3: Open in Browser
Once the server is running, open your web browser and go to:
``nhttp://localhost:3000
``n
## ??? How to Use
1. **Fresh Start**: The database (dairy_farm.sqlite) starts completely clean with 0 records.
2. **Add Animals**: Go to the **Animals** tab to add new cows/buffaloes to your herd.
3. **Record Milk**: Use the **Milk** tab to log daily milking records. You can use the Searchable Animal Picker to easily select animals.
4. **Manage Health & Feed**: Track vaccinations, medical cases, and feed inventory.
5. **View Reports**: Check the Dashboard and Reports page for a detailed overview of your farm's performance and financial status.

## ?? Mobile App (Android)
This project includes a Capacitor setup for building a native Android app that runs completely offline with a local SQLite database.
- Make sure Android Studio is installed.
- Run 
pm run build to build the web assets.
- Sync Capacitor with Android: 
px cap sync android`n- Open Android Studio: 
px cap open android`n
## ?? Resetting the Database
If you ever want to completely reset the system and clear all your data:
1. Stop the server (Ctrl + C).
2. Delete the dairy_farm.sqlite file in the project folder.
3. Start the server again (
pm run dev or 
px tsx server.ts). A fresh database will be created automatically.
