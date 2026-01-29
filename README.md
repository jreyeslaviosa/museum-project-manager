# Museum Project Manager

A comprehensive project management application designed for museum exhibitions and installations. Built with React and Vite, this application helps teams manage exhibition projects, track equipment inventory, and coordinate installations.

## Features

### Project Management
- Create and manage exhibition projects with artist information
- Track project status (Planning, In Progress, Installed, Complete, Maintenance)
- Set opening, closing, and deinstall dates
- Assign project managers and technical leads
- Task management with milestones and due dates
- Team workload visualization

### Equipment Tracking
- Track equipment provided by artists vs. museum
- Bill of Materials (BOM) management
- Shopping list aggregation across projects

### Inventory Management System
- **Full Asset Tracking**: Manage museum equipment including projectors, lenses, audio, LED, computers, cables, rigging, lighting, and media players
- **Reservation System**: Reserve equipment for future projects or check out immediately
- **Status Tracking**: Available, Reserved, In Use, Maintenance, Retired
- **Condition Monitoring**: Track equipment condition (Excellent, Good, Fair, Needs Repair, Out of Service)
- **Financial Tracking**: Purchase cost, depreciation, current value calculations
- **Maintenance Scheduling**: Track maintenance schedules and due dates
- **Photo Documentation**: Upload and store equipment photos
- **Checkout History**: Full history of equipment usage across projects
- **CSV Import/Export**: Bulk import inventory from CSV files

### Project-Inventory Integration
- Assign inventory items directly from project Equipment tab
- View project installation dates when selecting equipment
- See equipment availability and return dates
- Reserve equipment in advance for upcoming exhibitions

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router DOM 7** - Client-side routing
- **UUID** - Unique identifier generation
- **LocalStorage** - Data persistence (no backend required)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/museum-project-manager.git
cd museum-project-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard with project overview
│   ├── ProjectDetail.jsx      # Individual project view
│   ├── NewProject.jsx         # Create new project form
│   ├── Inventory.jsx          # Main inventory management page
│   ├── inventory/
│   │   ├── InventoryList.jsx      # Filterable inventory table
│   │   ├── InventoryDetail.jsx    # Single item detail view
│   │   ├── InventoryItemModal.jsx # Add/edit inventory item
│   │   ├── InventoryStats.jsx     # Dashboard statistics
│   │   ├── CheckoutModal.jsx      # Reserve/checkout/return flow
│   │   └── ImportModal.jsx        # CSV import functionality
│   └── tabs/
│       ├── OverviewTab.jsx        # Project overview
│       ├── TechRiderTab.jsx       # Technical rider management
│       ├── EquipmentTab.jsx       # Equipment lists + inventory assignment
│       ├── InstallationTab.jsx    # Installation planning
│       ├── BOMTab.jsx             # Bill of materials
│       ├── TasksTab.jsx           # Task management
│       └── MaintenanceTab.jsx     # Maintenance logging
├── utils/
│   ├── storage.js             # LocalStorage CRUD operations
│   └── constants.js           # App constants and options
├── App.jsx                    # Main app with routing
├── App.css                    # Global styles
└── main.jsx                   # Entry point
```

## Data Storage

All data is stored in the browser's LocalStorage:
- `museum_projects` - Project data
- `museum_inventory` - Inventory items

Data persists across browser sessions but is local to each browser/device.

## CSV Import Format

For bulk inventory import, use this CSV format:

```csv
name,category,serialNumber,condition,location,quantity,purchaseDate,purchaseCost,vendor,warrantyExpiration,notes
"Panasonic PT-RZ120",projectors,SN12345,excellent,Storage A,1,2023-01-15,8500,B&H Photo,2026-01-15,Main gallery projector
"Shure SM58",audio,SM58-001,good,Audio Closet,4,2022-06-01,99,Sweetwater,2024-06-01,Backup mics
```

### Valid Categories
- projectors, lenses, audio, led, computers, cables, rigging, lighting, media-players, other

### Valid Conditions
- excellent, good, fair, needs-repair, out-of-service

## Usage Guide

### Creating a Project
1. Click "+ New Project" from the Dashboard
2. Fill in project details (title, artist, dates, team)
3. Save and continue to add equipment, tasks, etc.

### Managing Inventory
1. Navigate to Inventory from the Dashboard header
2. Add items manually or import via CSV
3. Track item status, condition, and location

### Reserving Equipment for a Project
1. Open a project and go to the Equipment tab
2. Click "+ Assign from Inventory"
3. Choose "Reserve for Later" or "Check Out Now"
4. Select items and set dates
5. When ready to use, click "Start Use" to change from Reserved to In Use
6. Return items when the project is complete

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
