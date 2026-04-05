import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

const projectsRef = collection(db, 'projects')
const inventoryRef = collection(db, 'inventory')

// Projects

export const getProjects = async () => {
  const snapshot = await getDocs(projectsRef)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getProject = async (id) => {
  const snap = await getDoc(doc(db, 'projects', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const createProject = async (project) => {
  await setDoc(doc(db, 'projects', project.id), project)
  return project
}

export const updateProject = async (id, updates) => {
  const ref = doc(db, 'projects', id)
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() })
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() }
}

export const deleteProject = async (id) => {
  await deleteDoc(doc(db, 'projects', id))
}

export const saveProjects = async (projects) => {
  for (const project of projects) {
    await setDoc(doc(db, 'projects', project.id), project)
  }
}

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
  installDate: '',
  openingDate: '',
  closingDate: '',
  deinstallDate: '',
  budget: 0,
  maintenanceLog: [],
  inventoryItems: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

// Inventory

export const getInventory = async () => {
  const snapshot = await getDocs(inventoryRef)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getInventoryItem = async (id) => {
  const snap = await getDoc(doc(db, 'inventory', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const createInventoryItem = async (item) => {
  await setDoc(doc(db, 'inventory', item.id), item)
  return item
}

export const updateInventoryItem = async (id, updates) => {
  const ref = doc(db, 'inventory', id)
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() })
  const snap = await getDoc(ref)
  return { id: snap.id, ...snap.data() }
}

export const deleteInventoryItem = async (id) => {
  await deleteDoc(doc(db, 'inventory', id))
}

export const saveInventory = async (inventory) => {
  for (const item of inventory) {
    await setDoc(doc(db, 'inventory', item.id), item)
  }
}

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
})
