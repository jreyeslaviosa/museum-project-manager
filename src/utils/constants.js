export const TEAM_MEMBERS = [
  'Andre',
  'Daniel',
  'Dylan',
  'Jaime',
  'Marc',
  'Rodrigo',
  'Rommel',
  'Sofia',
  'Tiffani',
  'Tiger'
];

export const CONSUMABLE_PRESETS = [
  'Wood (plywood)',
  'Wood (MDF)',
  'Wood (lumber)',
  'Screws',
  'Nails',
  'Bolts & Nuts',
  'Paint (latex)',
  'Paint (spray)',
  'Primer',
  'Glue (wood)',
  'Glue (super)',
  'Epoxy',
  'Sandpaper',
  'Tape (gaffer)',
  'Tape (painters)',
  'Tape (double-sided)',
  'Zip ties',
  'Velcro',
  'Foam board',
  'Drywall',
  'Joint compound',
  'Caulk',
  'Wire',
  'Heat shrink tubing',
  'Solder',
  'Cleaning supplies',
  'Rags / cloths',
  'Trash bags',
  'Safety equipment',
];

export const SUGGESTED_STORES = [
  'Home Depot',
  'Lowes',
  'Amazon',
  'Benjamin Moore',
  'McMaster-Carr',
  'Blick Art Materials',
  'Uline',
  'Grainger',
  'B&H Photo',
  'Ace Hardware',
];

export const CONSUMABLE_UNITS = [
  'pcs',
  'sheets',
  'boards',
  'ft',
  'm',
  'gallons',
  'quarts',
  'liters',
  'lbs',
  'kg',
  'rolls',
  'boxes',
  'bags',
  'tubes',
  'cans',
  'packs',
];

export const INVENTORY_CATEGORIES = [
  { id: 'projectors', label: 'Projectors' },
  { id: 'lenses', label: 'Lenses' },
  { id: 'audio', label: 'Audio' },
  { id: 'led', label: 'LED' },
  { id: 'computers', label: 'Computers' },
  { id: 'cables', label: 'Cables' },
  { id: 'rigging', label: 'Rigging' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'media-players', label: 'Media Players' },
  { id: 'other', label: 'Other' }
];

export const CONDITION_OPTIONS = [
  { id: 'excellent', label: 'Excellent', color: '#10b981' },
  { id: 'good', label: 'Good', color: '#3b82f6' },
  { id: 'fair', label: 'Fair', color: '#f59e0b' },
  { id: 'needs-repair', label: 'Needs Repair', color: '#ef4444' },
  { id: 'out-of-service', label: 'Out of Service', color: '#6b7280' }
];

export const INVENTORY_STATUS_OPTIONS = [
  { id: 'available', label: 'Available', color: '#10b981' },
  { id: 'reserved', label: 'Reserved', color: '#8b5cf6' },
  { id: 'in-use', label: 'In Use', color: '#3b82f6' },
  { id: 'maintenance', label: 'Maintenance', color: '#f59e0b' },
  { id: 'retired', label: 'Retired', color: '#6b7280' }
];

export const USER_ROLES = {
  admin: { id: 'admin', label: 'Admin', description: 'Full access to everything' },
  purchasing: { id: 'purchasing', label: 'Purchasing', description: 'Admin access + purchasing dashboard' },
  builder: { id: 'builder', label: 'Builder', description: 'Read-only projects + request consumables' },
};

export const DEFAULT_ROLE = 'builder';

export const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank Project',
    description: 'Start from scratch with no pre-filled data',
    data: {}
  },
  {
    id: 'video-installation',
    label: 'Video Installation',
    description: 'Projector or screen-based video artwork',
    data: {
      museumProviding: [
        { id: 'tpl-1', name: 'Projector', quantity: 1, notes: '' },
        { id: 'tpl-2', name: 'Media Player', quantity: 1, notes: '' },
        { id: 'tpl-3', name: 'HDMI Cable', quantity: 2, notes: '' },
        { id: 'tpl-4', name: 'Power Strip', quantity: 1, notes: '' },
      ],
      tasks: [
        { id: 'tpl-t1', title: 'Receive and review tech rider', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t2', title: 'Confirm projector specs and lens', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t3', title: 'Build projection surface / wall', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t4', title: 'Run cables and power', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t5', title: 'Load and test media content', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t6', title: 'Calibrate projection alignment', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t7', title: 'Final walkthrough with artist', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
      ],
      bomList: [
        { id: 'tpl-b1', name: 'Paint (gallery white)', quantity: 2, unit: 'gallons', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b2', name: 'Blackout fabric', quantity: 1, unit: 'rolls', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
      ]
    }
  },
  {
    id: 'interactive-digital',
    label: 'Interactive / Digital',
    description: 'Sensor-based or computer-driven interactive piece',
    data: {
      museumProviding: [
        { id: 'tpl-1', name: 'Computer', quantity: 1, notes: '' },
        { id: 'tpl-2', name: 'Display / Projector', quantity: 1, notes: '' },
        { id: 'tpl-3', name: 'Sensor / Camera', quantity: 1, notes: '' },
        { id: 'tpl-4', name: 'Network Switch', quantity: 1, notes: '' },
        { id: 'tpl-5', name: 'Power Strip', quantity: 2, notes: '' },
      ],
      tasks: [
        { id: 'tpl-t1', title: 'Receive and review tech rider', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t2', title: 'Set up computer and install software', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t3', title: 'Install and calibrate sensors', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t4', title: 'Build enclosure / mount hardware', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t5', title: 'Run cables and network', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t6', title: 'Test interaction and edge cases', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t7', title: 'Set up auto-start on boot', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t8', title: 'Final walkthrough with artist', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
      ],
      bomList: [
        { id: 'tpl-b1', name: 'Paint (gallery white)', quantity: 2, unit: 'gallons', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b2', name: 'Cable management supplies', quantity: 1, unit: 'packs', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
      ]
    }
  },
  {
    id: 'sculpture-physical',
    label: 'Sculpture / Physical',
    description: 'Physical artwork requiring pedestal, rigging, or custom build',
    data: {
      museumProviding: [
        { id: 'tpl-1', name: 'Pedestal / Platform', quantity: 1, notes: '' },
        { id: 'tpl-2', name: 'Lighting (spot)', quantity: 2, notes: '' },
      ],
      tasks: [
        { id: 'tpl-t1', title: 'Receive artist specs and drawings', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t2', title: 'Build pedestal / platform', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t3', title: 'Prep gallery walls and floor', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t4', title: 'Receive and uncrate artwork', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t5', title: 'Position and secure artwork', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t6', title: 'Aim and focus lighting', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t7', title: 'Final walkthrough with artist', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
      ],
      bomList: [
        { id: 'tpl-b1', name: 'Paint (gallery white)', quantity: 2, unit: 'gallons', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b2', name: 'Plywood (for pedestal)', quantity: 2, unit: 'sheets', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b3', name: 'Screws', quantity: 1, unit: 'boxes', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
      ]
    }
  },
  {
    id: 'sound-installation',
    label: 'Sound Installation',
    description: 'Audio-based artwork with speakers and media playback',
    data: {
      museumProviding: [
        { id: 'tpl-1', name: 'Speakers', quantity: 2, notes: '' },
        { id: 'tpl-2', name: 'Amplifier', quantity: 1, notes: '' },
        { id: 'tpl-3', name: 'Media Player', quantity: 1, notes: '' },
        { id: 'tpl-4', name: 'Audio Cables', quantity: 4, notes: '' },
        { id: 'tpl-5', name: 'Power Strip', quantity: 1, notes: '' },
      ],
      tasks: [
        { id: 'tpl-t1', title: 'Receive and review tech rider', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t2', title: 'Plan speaker placement and acoustics', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t3', title: 'Mount / position speakers', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t4', title: 'Run audio cables and power', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t5', title: 'Load audio content and configure playback', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t6', title: 'Sound check and level adjustment', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t7', title: 'Final walkthrough with artist', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
      ],
      bomList: [
        { id: 'tpl-b1', name: 'Acoustic treatment panels', quantity: 4, unit: 'pcs', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
      ]
    }
  },
  {
    id: 'painting-2d',
    label: 'Painting / 2D Exhibition',
    description: 'Framed or unframed 2D works on walls',
    data: {
      museumProviding: [
        { id: 'tpl-1', name: 'Track Lighting', quantity: 1, notes: 'Per wall section' },
        { id: 'tpl-2', name: 'Hanging Hardware', quantity: 1, notes: '' },
      ],
      tasks: [
        { id: 'tpl-t1', title: 'Receive floorplan and hanging layout', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t2', title: 'Prep and paint gallery walls', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t3', title: 'Install hanging hardware', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t4', title: 'Receive and uncrate artwork', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t5', title: 'Hang and level artworks', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t6', title: 'Aim and focus lighting', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t7', title: 'Install labels and wall text', completed: false, isMilestone: false, assignees: [], dueDate: '', priority: 'normal' },
        { id: 'tpl-t8', title: 'Final walkthrough with curator', completed: false, isMilestone: true, assignees: [], dueDate: '', priority: 'normal' },
      ],
      bomList: [
        { id: 'tpl-b1', name: 'Paint (gallery white)', quantity: 3, unit: 'gallons', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b2', name: 'Spackle / joint compound', quantity: 1, unit: 'tubes', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
        { id: 'tpl-b3', name: 'Sandpaper', quantity: 1, unit: 'packs', status: 'to-buy', cost: 0, supplier: '', requestedBy: '', notes: '' },
      ]
    }
  }
];
