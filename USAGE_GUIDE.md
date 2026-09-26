# Dairy Farm ERP – Usage & Testing Guide

## 1️⃣ Quick Start (local development)
```bash
# 1. Clone the repo (once you have created it on GitHub)
# git clone https://github.com/<your‑username>/dairy-farm-erp.git
# cd dairy-farm-erp

# 2. Install dependencies
npm install

# 3. Reset / clean the demo SQLite database
# This removes the existing data file and lets the migrations recreate fresh seed data.
rm -f data/demo.db   # on Windows use `del data\demo.db`

# 4. Start the backend server (it will run the migrations automatically)
npx tsx server.ts   # server will be available at http://localhost:3000
```

## 2️⃣ Verify Seed Data
- Open your browser and navigate to:
```
http://localhost:3000/api/animals?status=Active
```
- You should receive a JSON array containing **≈100** animal objects (mixed male/female, pregnant, milking, etc.).
- Example of one entry:
```json
{
  "id": "C001",
  "sex": "Female",
  "breed": "Holstein",
  "isPregnant": true,
  "isMilking": true,
  "status": "Active"
}
```

## 3️⃣ UI – Using the Searchable Animal Picker
The new component lives at `src/components/AnimalSearchInput.tsx`.

### Where it is used
- **VaccinationPage.tsx** – for selecting an animal when recording a vaccination.
- It can be dropped into any other page (e.g., IndividualMilkModal) by importing it:
```tsx
import { AnimalSearchInput } from '../components/AnimalSearchInput';
```
### How to use it
```tsx
<AnimalSearchInput
  animals={cows}               // array of objects that follow the `Animal` interface
  value={formData.animalId}    // currently selected animal id
  onChange={(id) => setFormData({ ...formData, animalId: id })}
  placeholder="Select animal…"
/>
```
- **Behaviour**: start typing any part of the animal ID or its breed; matching items appear in a dropdown list; clicking a row selects it and clears the search box.
- **Styling**: Tailwind classes make it responsive out‑of‑the‑box. Adjust `className` on the `<input>` or `<ul>` if you need a custom look.

## 4️⃣ Testing the Component
A lightweight smoke‑test can be added with Jest (already part of the repo).
```ts
// src/tests/AnimalSearchInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimalSearchInput } from '../components/AnimalSearchInput';

const animals = [
  { id: 'C001', breed: 'Holstein' },
  { id: 'C002', breed: 'Jersey' },
];

test('filters list based on typed input', () => {
  const onChange = jest.fn();
  render(<AnimalSearchInput animals={animals} value="" onChange={onChange} />);

  const input = screen.getByPlaceholderText('Select animal...');
  fireEvent.change(input, { target: { value: 'jer' } });

  // the list should show only the Jersey cow
  expect(screen.getByText('C002 (Jersey)')).toBeInTheDocument();
  fireEvent.click(screen.getByText('C002 (Jersey)'));
  expect(onChange).toHaveBeenCalledWith('C002');
});
```
Run with:
```bash
npm test
```

## 5️⃣ Cleaning / Deleting Demo Data (script)
Create a small helper script (optional) at `scripts/cleanDemoDb.ps1`:
```powershell
# scripts/cleanDemoDb.ps1
# Deletes the SQLite file and restarts the server.
$dbPath = Join-Path $PSScriptRoot "..\data\demo.db"
if (Test-Path $dbPath) { Remove-Item -Force $dbPath }
Write-Host "Demo DB removed. Starting server..."
# Start the server (non‑blocking)
Start-Process -FilePath "npx" -ArgumentList "tsx server.ts" -WorkingDirectory (Resolve-Path "..")
```
Add a npm script for convenience in `package.json`:
```json
"scripts": {
  "clean-db": "powershell ./scripts/cleanDemoDb.ps1",
  "dev": "npx tsx server.ts"
}
```
Now you can simply run:
```bash
npm run clean-db
```
which wipes the data and launches a fresh server.

## 6️⃣ Preparing the Repository for GitHub
1. **Initialize Git (if not done yet)**
```bash
git init
git add .
git commit -m "Initial commit – demo data, searchable animal picker, and usage guide"
```
2. **Create a new repo on GitHub** (through the website or `gh` CLI) and push:
```bash
# Replace <url> with your repo URL
git remote add origin <url>
git branch -M main
git push -u origin main
```
3. **Upload the usage guide** – the `USAGE_GUIDE.md` you are reading now is already in the artifact folder; copy it into the repo root for future collaborators:
```bash
cp "C:/Users/Seefoo Sial/.gemini/antigravity-ide/brain/959f84d3-b709-4c91-a1d7-c137b222002a/USAGE_GUIDE.md" ./USAGE_GUIDE.md
git add USAGE_GUIDE.md
git commit -m "Add detailed usage & testing guide"
git push
```

## 7️⃣ Checklist – Confirm Everything Works
- [ ] Run `npm run clean-db` → server starts without errors.
- [ ] Visit `http://localhost:3000/api/animals?status=Active` → 100+ records.
- [ ] Open the web UI, create a vaccination, type in the animal search box → filtered list works.
- [ ] Run `npm test` → all tests (including the new component test) pass.
- [ ] Commit and push to GitHub, verify the `USAGE_GUIDE.md` appears in the repo.

---
### TL;DR
- **Reset data** with `npm run clean-db` (or manually delete `data/demo.db`).
- **Start server** → seeding runs automatically.
- **Use `AnimalSearchInput`** by importing it and passing your animal list.
- **Run tests** (`npm test`) to ensure the component behaves.
- **Push** everything to GitHub and keep the `USAGE_GUIDE.md` for future onboarding.

Feel free to ask if you need a more detailed script, CI configuration, or help wiring the component into the milk‑modal as well!
