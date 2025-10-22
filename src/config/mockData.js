// Mock data for local testing without Firebase

export const mockUsers = [
  {
    id: 'user1',
    email: 'manager@test.com',
    password: 'password123',
    name: 'John Manager',
    role: 'manager',
    location: 'Toronto',
    phone: '416-555-0100',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'user2',
    email: 'receiver@test.com',
    password: 'password123',
    name: 'Sarah Receiver',
    role: 'receiver',
    location: 'Toronto',
    phone: '416-555-0101',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'user3',
    email: 'receiver2@test.com',
    password: 'password123',
    name: 'Mike Receiver',
    role: 'receiver',
    location: 'Toronto',
    phone: '416-555-0102',
    active: true,
    createdAt: '2024-01-02T00:00:00.000Z'
  }
];

export const mockVendors = [
  {
    id: 'vendor1',
    name: 'Fresh Foods Supplier',
    contactPerson: 'David Smith',
    email: 'david@freshfoods.com',
    phone: '416-555-0200',
    address: '123 Warehouse St, Toronto, ON M5V 1A1',
    assignedReceivers: ['user2', 'user3'],
    location: 'Toronto',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'vendor2',
    name: 'Quality Dairy Products',
    contactPerson: 'Emma Johnson',
    email: 'emma@qualitydairy.com',
    phone: '416-555-0201',
    address: '456 Dairy Lane, Toronto, ON M5V 2B2',
    assignedReceivers: ['user2'],
    location: 'Toronto',
    active: true,
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    id: 'vendor3',
    name: 'Bakery Delights Inc',
    contactPerson: 'Robert Brown',
    email: 'robert@bakerydelights.com',
    phone: '416-555-0202',
    address: '789 Baker Ave, Toronto, ON M5V 3C3',
    assignedReceivers: ['user3'],
    location: 'Toronto',
    active: true,
    createdAt: '2024-01-03T00:00:00.000Z'
  }
];

export const mockProducts = [
  {
    id: 'product1',
    barcode: '0123456789012',
    productName: 'Whole Wheat Bread',
    brand: 'Artisan Bakery',
    ingredients: 'Whole wheat flour, water, yeast, salt, wheat gluten, contains: wheat',
    allergens: [
      { name: 'Wheat', priority: 'high', detected: true }
    ],
    imageUrl: '',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'product2',
    barcode: '0123456789013',
    productName: 'Chocolate Chip Cookies',
    brand: 'Sweet Treats',
    ingredients: 'Wheat flour, sugar, butter (milk), eggs, chocolate chips (milk, soy lecithin), baking soda, vanilla extract. Contains: wheat, milk, eggs, soy',
    allergens: [
      { name: 'Wheat', priority: 'high', detected: true },
      { name: 'Milk', priority: 'high', detected: true },
      { name: 'Eggs', priority: 'high', detected: true },
      { name: 'Soy', priority: 'high', detected: true }
    ],
    imageUrl: '',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockScanningSessions = [
  {
    id: 'session1',
    vendorId: 'vendor1',
    vendorName: 'Fresh Foods Supplier',
    receiverId: 'user2',
    receiverName: 'Sarah Receiver',
    location: 'Toronto',
    startTime: '2024-01-15T09:00:00.000Z',
    endTime: '2024-01-15T10:30:00.000Z',
    status: 'completed',
    productsScanned: 15,
    allergenWarnings: 8,
    createdAt: '2024-01-15T09:00:00.000Z',
    submittedAt: '2024-01-15T10:35:00.000Z',
    products: [
      {
        barcode: '0123456789012',
        productName: 'Whole Wheat Bread',
        brand: 'Artisan Bakery',
        quantity: 5,
        damaged: 0,
        allergens: [{ name: 'Wheat', priority: 'high' }]
      },
      {
        barcode: '0123456789013',
        productName: 'Chocolate Chip Cookies',
        brand: 'Sweet Treats',
        quantity: 10,
        damaged: 1,
        allergens: [
          { name: 'Wheat', priority: 'high' },
          { name: 'Milk', priority: 'high' },
          { name: 'Eggs', priority: 'high' },
          { name: 'Soy', priority: 'high' }
        ]
      }
    ]
  },
  {
    id: 'session2',
    vendorId: 'vendor2',
    vendorName: 'Quality Dairy Products',
    receiverId: 'user2',
    receiverName: 'Sarah Receiver',
    location: 'Toronto',
    startTime: '2024-01-16T14:00:00.000Z',
    endTime: '2024-01-16T15:15:00.000Z',
    status: 'submitted',
    productsScanned: 12,
    allergenWarnings: 12,
    createdAt: '2024-01-16T14:00:00.000Z',
    submittedAt: '2024-01-16T15:20:00.000Z',
    products: [
      {
        barcode: '0123456789014',
        productName: 'Whole Milk',
        brand: 'Quality Dairy',
        quantity: 12,
        damaged: 0,
        allergens: [{ name: 'Milk', priority: 'high' }]
      }
    ]
  }
];

export const mockInventory = [
  {
    id: 'inv1',
    barcode: '0123456789012',
    productName: 'Whole Wheat Bread',
    brand: 'Artisan Bakery',
    quantity: 25,
    allergens: [{ name: 'Wheat', priority: 'high' }],
    sessionId: 'session1',
    vendorId: 'vendor1',
    receiverId: 'user2',
    location: 'Toronto',
    addedAt: '2024-01-15T09:30:00.000Z',
    updatedAt: '2024-01-15T09:30:00.000Z'
  },
  {
    id: 'inv2',
    barcode: '0123456789013',
    productName: 'Chocolate Chip Cookies',
    brand: 'Sweet Treats',
    quantity: 40,
    allergens: [
      { name: 'Wheat', priority: 'high' },
      { name: 'Milk', priority: 'high' },
      { name: 'Eggs', priority: 'high' },
      { name: 'Soy', priority: 'high' }
    ],
    sessionId: 'session1',
    vendorId: 'vendor1',
    receiverId: 'user2',
    location: 'Toronto',
    addedAt: '2024-01-15T09:45:00.000Z',
    updatedAt: '2024-01-15T09:45:00.000Z'
  },
  {
    id: 'inv3',
    barcode: '0123456789014',
    productName: 'Whole Milk',
    brand: 'Quality Dairy',
    quantity: 50,
    allergens: [{ name: 'Milk', priority: 'high' }],
    sessionId: 'session2',
    vendorId: 'vendor2',
    receiverId: 'user2',
    location: 'Toronto',
    addedAt: '2024-01-16T14:30:00.000Z',
    updatedAt: '2024-01-16T14:30:00.000Z'
  },
  {
    id: 'inv4',
    barcode: '0123456789015',
    productName: 'Peanut Butter',
    brand: 'Nutty Spread',
    quantity: 30,
    allergens: [{ name: 'Peanuts', priority: 'high' }],
    sessionId: 'session1',
    vendorId: 'vendor1',
    receiverId: 'user2',
    location: 'Toronto',
    addedAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'inv5',
    barcode: '0123456789016',
    productName: 'Almond Milk',
    brand: 'Plant Based',
    quantity: 35,
    allergens: [{ name: 'Tree Nuts', priority: 'high' }],
    sessionId: 'session1',
    vendorId: 'vendor1',
    receiverId: 'user3',
    location: 'Toronto',
    addedAt: '2024-01-15T10:15:00.000Z',
    updatedAt: '2024-01-15T10:15:00.000Z'
  }
];

// Helper function to generate unique IDs
export const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Local storage keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'allery_current_user',
  USERS: 'allery_users',
  VENDORS: 'allery_vendors',
  PRODUCTS: 'allery_products',
  SESSIONS: 'allery_sessions',
  INVENTORY: 'allery_inventory'
};

// Initialize local storage with mock data
export const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(mockVendors));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(mockScanningSessions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(mockInventory));
  }
};

// Get data from local storage
export const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Save data to local storage
export const saveLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
