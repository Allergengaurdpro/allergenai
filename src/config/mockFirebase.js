// Mock Firebase implementation for local testing
import {
  initializeMockData,
  getLocalData,
  saveLocalData,
  generateId,
  STORAGE_KEYS
} from './mockData';

// Initialize mock data on startup
initializeMockData();

// Mock Auth
export const auth = {
  currentUser: null
};

// Mock Firestore functions
export const db = {};

export const collection = (db, collectionName) => {
  return { collectionName };
};

export const doc = (db, collectionName, docId) => {
  return { collectionName, docId };
};

export const query = (collectionRef, ...constraints) => {
  return { collectionRef, constraints };
};

export const where = (field, operator, value) => {
  return { type: 'where', field, operator, value };
};

export const orderBy = (field, direction = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (limitValue) => {
  return { type: 'limit', value: limitValue };
};

export const getDocs = async (queryRef) => {
  const collectionName = queryRef.collectionRef?.collectionName || queryRef.collectionName;
  const constraints = queryRef.constraints || [];

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      storageKey = null;
  }

  if (!storageKey) return { docs: [], size: 0 };

  let data = getLocalData(storageKey);

  // Apply where constraints
  constraints.forEach(constraint => {
    if (constraint.type === 'where') {
      data = data.filter(item => {
        const value = item[constraint.field];
        switch (constraint.operator) {
          case '==':
            return value === constraint.value;
          case '!=':
            return value !== constraint.value;
          case '>':
            return value > constraint.value;
          case '>=':
            return value >= constraint.value;
          case '<':
            return value < constraint.value;
          case '<=':
            return value <= constraint.value;
          case 'array-contains':
            return Array.isArray(value) && value.includes(constraint.value);
          default:
            return true;
        }
      });
    }
  });

  // Apply orderBy
  constraints.forEach(constraint => {
    if (constraint.type === 'orderBy') {
      data.sort((a, b) => {
        const aVal = a[constraint.field];
        const bVal = b[constraint.field];
        if (constraint.direction === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
  });

  // Apply limit
  constraints.forEach(constraint => {
    if (constraint.type === 'limit') {
      data = data.slice(0, constraint.value);
    }
  });

  return {
    docs: data.map(item => ({
      id: item.id,
      data: () => item,
      exists: () => true
    })),
    size: data.length
  };
};

export const getDoc = async (docRef) => {
  const { collectionName, docId } = docRef;

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      return { exists: () => false, data: () => null };
  }

  const data = getLocalData(storageKey);
  const item = data.find(d => d.id === docId);

  return {
    exists: () => !!item,
    data: () => item || null,
    id: docId
  };
};

export const addDoc = async (collectionRef, data) => {
  const { collectionName } = collectionRef;

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      throw new Error('Invalid collection');
  }

  const currentData = getLocalData(storageKey);
  const newId = generateId();
  const newItem = { id: newId, ...data };
  currentData.push(newItem);
  saveLocalData(storageKey, currentData);

  return { id: newId };
};

export const updateDoc = async (docRef, data) => {
  const { collectionName, docId } = docRef;

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      throw new Error('Invalid collection');
  }

  const currentData = getLocalData(storageKey);
  const index = currentData.findIndex(item => item.id === docId);

  if (index !== -1) {
    currentData[index] = { ...currentData[index], ...data };
    saveLocalData(storageKey, currentData);
  }
};

export const deleteDoc = async (docRef) => {
  const { collectionName, docId } = docRef;

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      throw new Error('Invalid collection');
  }

  const currentData = getLocalData(storageKey);
  const filteredData = currentData.filter(item => item.id !== docId);
  saveLocalData(storageKey, filteredData);
};

export const setDoc = async (docRef, data) => {
  const { collectionName, docId } = docRef;

  let storageKey = '';
  switch (collectionName) {
    case 'users':
      storageKey = STORAGE_KEYS.USERS;
      break;
    case 'vendors':
      storageKey = STORAGE_KEYS.VENDORS;
      break;
    case 'products':
      storageKey = STORAGE_KEYS.PRODUCTS;
      break;
    case 'scanning_sessions':
      storageKey = STORAGE_KEYS.SESSIONS;
      break;
    case 'inventory':
      storageKey = STORAGE_KEYS.INVENTORY;
      break;
    default:
      throw new Error('Invalid collection');
  }

  const currentData = getLocalData(storageKey);
  const index = currentData.findIndex(item => item.id === docId);

  if (index !== -1) {
    currentData[index] = { id: docId, ...data };
  } else {
    currentData.push({ id: docId, ...data });
  }

  saveLocalData(storageKey, currentData);
};

// Mock Storage
export const storage = {};

export const ref = (storage, path) => {
  return { path };
};

export const uploadBytes = async (storageRef, file) => {
  // Mock upload - just return success
  return { ref: storageRef };
};

export const getDownloadURL = async (storageRef) => {
  // Return a mock URL (data URL from file would be better, but this works for testing)
  return `https://via.placeholder.com/400x300?text=${encodeURIComponent(storageRef.path)}`;
};
