# Museum Project Manager

A project management app for museum exhibitions and installations. Built with React and Firebase, it helps teams manage projects, track inventory, coordinate maintenance, and handle day-to-day operations across multiple locations.

## Features

### Project Management
- Create and manage exhibition projects with artist information
- Track project status (Planning, In Progress, Installed, Complete, Maintenance)
- Project templates (video installation, sculpture, interactive, etc.)
- Register pre-existing installations for ongoing maintenance tracking
- Set opening, closing, and deinstall dates
- Assign project managers and technical leads
- Task management with milestones, due dates, and multi-assignee support
- Bill of Materials (BOM) management with shopping list aggregation
- Equipment lists (artist-provided vs. museum-provided)
- Installation planning with image uploads
- Maintenance logging per project

### Inventory Management
- Full asset tracking for projectors, lenses, audio, LED, computers, cables, rigging, lighting, and media players
- Reservation system: reserve equipment for future projects or check out immediately
- Status tracking: Available, Reserved, In Use, Maintenance, Retired
- Condition monitoring: Excellent, Good, Fair, Needs Repair, Out of Service
- Financial tracking with purchase cost, depreciation, and current value
- Maintenance scheduling with due date tracking
- Photo documentation and checkout history
- CSV import/export for bulk operations
- Assign inventory items directly from project Equipment tab

### Rooms & Spaces
- Track room dimensions (L x W x H), floor, and type
- Room features: WiFi, A/C, dimmer, outlets, load capacity
- Filter by location and floor
- See which projects are installed in each room

### Maintenance Issues
- Standalone issue tracker for problems across all spaces
- Urgency levels: Low, Medium, High, Critical
- Status workflow: Open, In Progress, Resolved
- Room picker from existing rooms or custom location
- Assign to team members, track who reported and resolved

### Consumables
- Request workshop supplies (wood, paint, screws, etc.)
- Quick-add with type-ahead suggestions and store selection
- Track status: Pending, Ordered, Received
- Auto-fill requester from logged-in user

### Purchasing
- Aggregated view of all pending consumable requests and BOM items to buy
- Filter and sort across all projects

### Team Workload
- Cross-project view of each team member's active and completed tasks
- Relative load bars for visual comparison
- Overdue task highlighting
- Filter by busy, available, or overdue members
- Expandable task details grouped by project

### Authentication & Access Control
- Firebase Authentication (email/password)
- Email allowlist: admins control who can sign in
- Role-based access: Admin, Purchasing, Builder
- First user automatically becomes admin
- Empty allowlist allows open access (for initial setup)

### Other
- Global search across projects, inventory, and consumables
- Notification bell for overdue tasks and upcoming deadlines
- Responsive design for desktop and mobile

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router DOM 7** - Client-side routing
- **Firebase** - Authentication and Firestore database
- **UUID** - Unique identifier generation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jreyeslaviosa/museum-project-manager.git
cd museum-project-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `src/utils/firebase.js` file with your Firebase config:
```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── Home.jsx               # Home page with search and navigation
│   ├── Login.jsx              # Login page
│   ├── Dashboard.jsx          # Admin dashboard with project overview
│   ├── ProjectDetail.jsx      # Individual project view
│   ├── NewProject.jsx         # Create new project / register existing
│   ├── Inventory.jsx          # Inventory management
│   ├── Consumables.jsx        # Consumable supplies tracking
│   ├── Purchasing.jsx         # Purchasing dashboard
│   ├── Rooms.jsx              # Rooms & spaces management
│   ├── Issues.jsx             # Maintenance issue tracker
│   ├── Workload.jsx           # Team workload overview
│   ├── UserManagement.jsx     # Team management and email allowlist
│   ├── inventory/
│   │   ├── InventoryList.jsx
│   │   ├── InventoryDetail.jsx
│   │   ├── InventoryItemModal.jsx
│   │   ├── InventoryStats.jsx
│   │   ├── CheckoutModal.jsx
│   │   └── ImportModal.jsx
│   └── tabs/
│       ├── OverviewTab.jsx
│       ├── TechRiderTab.jsx
│       ├── EquipmentTab.jsx
│       ├── InstallationTab.jsx
│       ├── BOMTab.jsx
│       ├── TasksTab.jsx
│       └── MaintenanceTab.jsx
├── utils/
│   ├── firebase.js            # Firebase configuration
│   ├── storage.js             # Firestore CRUD operations
│   ├── UserContext.jsx        # Auth context and access control
│   └── constants.js           # App constants, roles, templates
├── App.jsx
├── App.css
└── main.jsx
```

## Data Storage

All data is stored in Firebase Firestore:
- `projects` - Exhibition and installation data
- `inventory` - Equipment and asset tracking
- `consumables` - Workshop supply requests
- `rooms` - Room and space information
- `issues` - Maintenance issue reports
- `users` - User profiles and roles
- `allowlist` - Authorized email addresses

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to everything including inventory, user management, and allowlist |
| **Purchasing** | Admin access plus purchasing dashboard |
| **Builder** | Read-only projects, request consumables, view rooms/issues/workload |

## License

MIT
