const categoryIconPaths = {
  directory: `<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />`,
  terminal: `<rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" />`,
  network: `<circle cx="12" cy="5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="M12 7v4M5 16v-2h14v2M12 11H5v3M12 11h7v3" />`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />`,
  gamepad: `<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" /><path d="M17.3 6H6.7a4 4 0 0 0-3.8 2.7l-1.4 4.2A3.9 3.9 0 0 0 5.2 18c1.3 0 2.4-.6 3.1-1.6l.4-.6h6.6l.4.6a3.8 3.8 0 0 0 6.8-3.5l-1.4-4.2A4 4 0 0 0 17.3 6Z" />`,
  shoppingBag: `<path d="M6 8V6a6 6 0 0 1 12 0v2" /><path d="M4 8h16l-1 13H5L4 8Z" />`,
  globe: `<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />`,
  smartphone: `<rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 5h4M11 18h2" />`,
  layoutGrid: `<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7h3v3H8zM14 7h3v3h-3zM8 14h3v3H8zM14 14h3v3h-3z" />`,
  newspaper: `<path d="M5 4h14a2 2 0 0 1 2 2v13H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 8h8M7 12h4M7 16h4M15 12h2v4h-2z" />`,
  graduationCap: `<path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11.5V16c3.5 2.7 8.5 2.7 12 0v-4.5M22 9v6" />`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />`,
  messages: `<path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v8Z" /><path d="M7 9h10M7 13h6" />`,
  pen: `<path d="m15 5 4 4M4 20l3.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" /><path d="m13.5 5.5 4 4" />`,
  video: `<rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" />`,
  wifi: `<path d="M4.9 12.5a10 10 0 0 1 14.2 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="20" r="1" />`
};

export function renderCategoryIcon(icon) {
  const paths = categoryIconPaths[icon];
  if (!paths) throw new Error(`Unknown category icon: ${icon}`);

  return `<svg class="category-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export const categoryMeta = {
  "Software Companies": {
    icon: "terminal",
    description: "Companies building software products, platforms and digital services in Nepal."
  },
  Organization: {
    icon: "network",
    description: "Organizations supporting founders, developers and Nepal's wider technology community."
  },
  "CyberSecurity Companies": {
    icon: "shield",
    description: "Teams focused on security engineering, research, consulting and digital resilience."
  },
  "Games Studios": {
    icon: "gamepad",
    description: "Studios creating games and interactive entertainment from Nepal."
  },
  "Ecommerce Marketplaces": {
    icon: "shoppingBag",
    description: "Marketplaces connecting customers, merchants and services online."
  },
  "Online Services": {
    icon: "globe",
    description: "Digital services used by people and businesses across Nepal."
  },
  "Mobile Apps": {
    icon: "smartphone",
    description: "Mobile products built for Nepal or by teams connected to Nepal."
  },
  "News Apps": {
    icon: "layoutGrid",
    description: "Apps and digital products that aggregate or deliver news in Nepal."
  },
  "Tech News": {
    icon: "newspaper",
    description: "Publications covering technology, products and the local digital economy."
  },
  Education: {
    icon: "graduationCap",
    description: "Learning platforms and resources for technology education."
  },
  "Facebook Pages Groups": {
    icon: "users",
    description: "Facebook communities where Nepal's technology ecosystem gathers and shares."
  },
  "Twitter Handles": {
    icon: "messages",
    description: "People sharing useful technology perspectives and updates."
  },
  "Tech Blogs": {
    icon: "pen",
    description: "Independent writing on engineering, products and technology."
  },
  "YouTube Channels": {
    icon: "video",
    description: "Video creators covering technology, products and entrepreneurship."
  },
  "ISP Internet Service Providers": {
    icon: "wifi",
    description: "Internet service providers connecting homes and businesses across Nepal."
  }
};
