# Testing Guide for Allery PWA (Local Mode)

The app is now configured to run with **mock local storage** instead of Firebase for easy testing.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Test Credentials

The app comes with pre-configured test accounts:

### Manager Account
- **Email:** `manager@test.com`
- **Password:** `password123`

### Receiver Accounts
- **Email:** `receiver@test.com`
- **Password:** `password123`

- **Email:** `receiver2@test.com`
- **Password:** `password123`

## Testing Workflow

### As Manager

1. **Login** with manager credentials (`manager@test.com` / `password123`)

2. **Dashboard Overview**
   - View statistics (total scans, today's scans, active receivers, products)
   - See allergen distribution chart
   - View recent activity

3. **User Management Tab**
   - View existing users (1 manager, 2 receivers)
   - Click "Add New User" to create a new user
   - Edit existing users
   - Toggle user active/inactive status
   - Delete users

4. **Vendors Tab**
   - View existing vendors (3 pre-loaded vendors)
   - Click "Add New Vendor" to add a supplier
   - Edit vendor information
   - Assign/unassign receivers to vendors
   - Delete vendors

5. **Scanning Activity Tab**
   - View all scanning sessions from all receivers
   - Filter by receiver or date range
   - Click on a session to see detailed information
   - View products scanned in each session

6. **Allergen Inventory Tab**
   - View overall allergen statistics
   - See allergen distribution chart
   - Search and filter products by allergen type
   - View detailed product information with allergen tags
   - Check risk levels (low, medium, high)

### As Receiver

1. **Login** with receiver credentials (`receiver@test.com` / `password123`)

2. **Dashboard - My Tasks**
   - View your statistics (today's scans, weekly scans, products, warnings)
   - See assigned vendors (Fresh Foods Supplier, Quality Dairy Products)
   - Click "Start Scanning" on any vendor to begin a scanning session
   - View recent sessions

3. **Start a Scanning Session**
   - Select a vendor and click "Start Scanning"
   - You'll be redirected to the scanning session page

4. **Scanning Products**

   **Option A: Scan Barcode with Open Food Facts Integration**
   - Click "Scan Barcode" button
   - Enter a real barcode from Open Food Facts database:
     - **737628064502** (Nutella Ferrero) ✅ Recommended
     - **3017620422003** (Nutella 350g)
     - **5000112548871** (Coca-Cola)
     - **8076809513012** (Barilla Pasta)
     - **4000539701207** (Milka Chocolate)
     - **80177173** (Skippy Peanut Butter)
   - Wait for "Product found!" message
   - Review the pre-filled product information from Open Food Facts
   - Product name, brand, ingredients, and image are automatically filled!
   - Allergens are automatically detected from ingredients
   - Adjust quantity and damaged units
   - Click "Save Product"

   **Option B: Test with Local Database**
   - Enter barcode: `0123456789012` or `0123456789013`
   - These are in the local mock database
   - Product will load instantly

   **Option C: Add Manually**
   - Click "Add Manually"
   - Fill in product details:
     - Product Name: e.g., "Almond Cookies"
     - Brand: e.g., "Baker's Choice"
     - Take a photo or select an image
     - Click "Extract Ingredients (OCR)" to simulate OCR (mock data)
     - Or manually enter ingredients: "Flour, almonds, sugar, butter, eggs. Contains: wheat, tree nuts, milk, eggs"
   - Adjust quantity and damaged units
   - The app will automatically detect allergens as you type
   - Click "Save Product"

5. **Review Products**
   - See all scanned products in the list
   - Each product shows allergen tags (if any)
   - Remove products if needed

6. **Complete Session**
   - Click "Complete Session"
   - Review all products and allergen warnings
   - Download allergen labels for products with warnings
   - Click "Submit Session"

7. **Scanning History Tab**
   - View all your past scanning sessions
   - Click on a session to see details
   - Check products scanned and allergen information

8. **My Allergens Tab**
   - View allergen statistics for products you've scanned
   - See breakdown by allergen type
   - Filter products by specific allergens
   - View product images and details

## Testing Open Food Facts Integration

### Real Barcodes to Try (with Internet Connection):

**Chocolate Products:**
- `737628064502` - Nutella Ferrero (Contains: Milk, Tree Nuts, Soy)
- `3017620422003` - Nutella 350g
- `4000539701207` - Milka Chocolate Bar

**Beverages:**
- `5000112548871` - Coca-Cola Can

**Pasta & Grains:**
- `8076809513012` - Barilla Pasta (Contains: Wheat, Eggs)

**Peanut Products:**
- `80177173` - Skippy Peanut Butter (Contains: Peanuts)

**Dairy:**
- `7613033074486` - Lindt Chocolate (Contains: Milk, Soy)

### What to Look For:
1. ✅ Loading spinner while fetching
2. ✅ "Product found!" success message
3. ✅ Pre-filled product name and brand
4. ✅ Ingredients automatically loaded
5. ✅ Product image displayed
6. ✅ Allergens detected from ingredients
7. ✅ Green banner showing "Product found in Open Food Facts database!"

### If Product Not Found:
- You'll see "Product not found in database"
- Form will be empty for manual entry
- This is normal - not all products are in the database

## Mock Data Included

The app comes pre-loaded with:

- **3 Users** (1 manager, 2 receivers)
- **3 Vendors** with receiver assignments
- **2 Products** in the database
- **2 Scanning Sessions** (completed and submitted)
- **5 Inventory Items** with various allergens

## Testing Allergen Detection

Try entering these ingredients to test allergen detection:

### High Priority Allergens:
- **Peanuts:** "Contains peanuts, peanut oil"
- **Tree Nuts:** "Made with almonds, cashews, walnuts"
- **Milk:** "Contains milk, butter, cheese, whey, lactose"
- **Eggs:** "Eggs, egg whites, mayonnaise"
- **Fish:** "Salmon, tuna, anchovy extract"
- **Shellfish:** "Shrimp, lobster, crab meat"
- **Soy:** "Soy sauce, soybean oil, tofu, soy lecithin"
- **Wheat:** "Wheat flour, gluten, graham crackers"
- **Sesame:** "Sesame seeds, tahini, sesame oil"

### Medium Priority Allergens:
- **Mustard:** "Mustard, mustard seeds"
- **Sulphites:** "Contains sulphites, sodium bisulfite"

### Multiple Allergens:
Try: "Wheat flour, milk, eggs, butter, soy lecithin, peanut oil, almonds. Contains: wheat, milk, eggs, soy, peanuts, tree nuts"

This will trigger a **high-risk warning** (3+ allergens).

## Testing Features

### ✅ Authentication
- [x] Login with manager account
- [x] Login with receiver account
- [x] Logout functionality
- [x] Role-based dashboard redirection

### ✅ Manager Features
- [x] View dashboard statistics
- [x] Create/edit/delete users
- [x] Manage vendors
- [x] Assign receivers to vendors
- [x] Monitor all scanning activities
- [x] View allergen inventory
- [x] Filter and search data
- [x] View charts and analytics

### ✅ Receiver Features
- [x] View assigned vendors
- [x] Start scanning session
- [x] Scan barcode with Open Food Facts lookup
- [x] Real-time product data from Open Food Facts API
- [x] Add products manually
- [x] OCR simulation for ingredients
- [x] Automatic allergen detection
- [x] Complete scanning session
- [x] Review and submit session
- [x] Download allergen labels
- [x] View scanning history
- [x] View personal allergen statistics

### ✅ Open Food Facts Integration
- [x] Fetch product data by barcode
- [x] Display product name, brand, ingredients
- [x] Show product images
- [x] Extract allergen information
- [x] Handle products not found
- [x] Loading states and error handling
- [x] Visual feedback when data is from Open Food Facts

### ✅ Allergen Detection
- [x] Detects all 11 Canadian priority allergens
- [x] Priority-based warnings (high/medium)
- [x] Risk level calculation (low/medium/high/severe)
- [x] Visual allergen tags
- [x] Real-time detection as you type

### ✅ UI/UX
- [x] Responsive design (desktop/tablet/mobile)
- [x] Blue theme throughout
- [x] Modal dialogs
- [x] Charts and visualizations
- [x] Smooth animations
- [x] Loading states
- [x] Error handling
- [x] Success messages

## Data Persistence

All data is stored in **localStorage**, so:
- Data persists across page refreshes
- Each browser/device has separate data
- Clear localStorage to reset: Open DevTools → Application → Local Storage → Clear All

## Known Limitations (Testing Mode)

1. **Barcode Scanner:** Camera scanning is functional but manual entry is easier for testing
2. **OCR:** Returns mock data instead of actual text extraction
3. **Open Food Facts:** Requires internet connection (works with real API)
4. **Image Upload:** Works but returns placeholder URLs in mock mode
5. **No Backend:** All data except Open Food Facts is local to your browser

## Troubleshooting

### Open Food Facts not working?
- ✅ Check internet connection
- ✅ Open browser console (F12) to see API responses
- ✅ Try different barcodes from the list above
- ✅ Some products may not exist in the database

### CORS Issues?
- Open Food Facts API supports CORS, should work from localhost
- If issues persist, check browser console for errors

## Switching to Firebase

When ready for production:
1. Update imports in all files from `mockFirebase` back to `firebase`
2. Configure Firebase credentials in `src/config/firebase.js`
3. Deploy Firestore rules and indexes
4. All functionality will work with real backend

## Support

If you encounter any issues during testing, check:
- Browser console for errors (F12)
- Network tab for API calls
- localStorage for data persistence
- React DevTools for component state

Happy Testing! 🎉
