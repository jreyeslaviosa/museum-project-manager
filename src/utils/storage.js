const STORAGE_KEY = 'museum_projects';
const INVENTORY_KEY = 'museum_inventory';

export const getProjects = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProjects = (projects) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const getProject = (id) => {
  const projects = getProjects();
  return projects.find(p => p.id === id);
};

export const createProject = (project) => {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  return project;
};

export const updateProject = (id, updates) => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    saveProjects(projects);
    return projects[index];
  }
  return null;
};

export const deleteProject = (id) => {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  saveProjects(filtered);
};

export const createEmptyProject = () => ({
  id: '',
  title: '',
  artistName: '',
  projectManager: '',
  technicalLead: '',
  status: 'planning',
  description: '',
  techRider: null,
  artistProviding: [],
  museumProviding: [],
  installationPlan: '',
  installationImages: [],
  bomList: [],
  tasks: [],
  notes: '',
  // Exhibition dates
  openingDate: '',
  closingDate: '',
  deinstallDate: '',
  // Budget
  budget: 0,
  // Maintenance
  maintenanceLog: [],
  // Inventory items assigned to this project
  inventoryItems: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Inventory CRUD operations
export const getInventory = () => {
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInventory = (inventory) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
};

export const getInventoryItem = (id) => {
  const inventory = getInventory();
  return inventory.find(item => item.id === id);
};

export const createInventoryItem = (item) => {
  const inventory = getInventory();
  inventory.push(item);
  saveInventory(inventory);
  return item;
};

export const updateInventoryItem = (id, updates) => {
  const inventory = getInventory();
  const index = inventory.findIndex(item => item.id === id);
  if (index !== -1) {
    inventory[index] = { ...inventory[index], ...updates, updatedAt: new Date().toISOString() };
    saveInventory(inventory);
    return inventory[index];
  }
  return null;
};

export const deleteInventoryItem = (id) => {
  const inventory = getInventory();
  const filtered = inventory.filter(item => item.id !== id);
  saveInventory(filtered);
};

export const createEmptyInventoryItem = () => ({
  id: '',
  name: '',
  category: 'other',
  description: '',
  serialNumber: '',
  barcode: '',
  condition: 'good',
  status: 'available',
  location: '',
  quantity: 1,
  quantityAvailable: 1,
  purchaseDate: '',
  purchaseCost: 0,
  vendor: '',
  warrantyExpiration: '',
  depreciationYears: 5,
  currentValue: 0,
  photos: [],
  currentCheckout: null,
  checkoutHistory: [],
  maintenanceSchedule: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
