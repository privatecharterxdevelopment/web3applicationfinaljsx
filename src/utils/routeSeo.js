const SITE_ORIGIN = 'https://www.privatecharterx.com';

/** Public marketing pages — indexed on Google with unique title + description */
export const PUBLIC_SEO_ROUTES = {
  '/': {
    title: 'PrivateCharterX | Luxury Travel & Web3 — Jets, AI Concierge',
    description:
      'Private jets, empty legs, helicopters, commercial flights, and AI luxury concierge. Book aviation, adventures, and lifestyle services on one Web3-ready platform.',
  },
  '/services': {
    title: 'Services | PrivateCharterX — Luxury Aviation & Lifestyle',
    description:
      'Explore PrivateCharterX services: private jets, helicopters, empty legs, flight bids, commercial flights, adventures, PaymentX, and AI concierge booking.',
  },
  '/jets': {
    title: 'Private Jets | PrivateCharterX Charter',
    description:
      'Search and request private jet charter worldwide. Compare aircraft, get quotes, and book luxury jet travel with PrivateCharterX.',
  },
  '/helis': {
    title: 'Helicopters | PrivateCharterX Charter',
    description:
      'Book helicopter charter for city transfers, resorts, and events. Search routes and request quotes on PrivateCharterX.',
  },
  '/empty-legs': {
    title: 'Empty Legs | PrivateCharterX — Discount Private Flights',
    description:
      'Browse empty leg private jet flights at reduced rates. Last-minute luxury aviation deals updated on PrivateCharterX.',
  },
  '/flight-bids': {
    title: 'Flight Bids | PrivateCharterX',
    description:
      'Place bids on private jet routes and flight opportunities. Competitive pricing for luxury air travel on PrivateCharterX.',
  },
  '/adventures': {
    title: 'Adventures | PrivateCharterX Luxury Experiences',
    description:
      'Discover curated luxury adventures and experiences. Book exclusive trips and lifestyle packages with PrivateCharterX.',
  },
  '/flights': {
    title: 'Commercial Flights | PrivateCharterX',
    description:
      'Search and book commercial airline flights with PrivateCharterX. Integrated luxury travel planning and AI assistance.',
  },
  '/paymentx': {
    title: 'PaymentX | PrivateCharterX Card & Payments',
    description:
      'PaymentX by PrivateCharterX — premium payment and card program for luxury travelers. Apply and manage your membership.',
  },
  '/blog': {
    title: 'Blog | PrivateCharterX — Luxury Travel & Web3',
    description:
      'News and insights on private aviation, luxury travel, Web3, and tokenized assets from the PrivateCharterX team.',
  },
};

const DEFAULT_HOME = PUBLIC_SEO_ROUTES['/'];

const NOINDEX_PREFIXES = [
  '/crm',
  '/admin',
  '/login',
  '/register',
  '/profile',
  '/settings',
  '/checkout',
  '/rws',
  '/dashboard',
  '/chat',
  '/ground-transport',
];

export function getSeoForPath(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  const config = PUBLIC_SEO_ROUTES[path];

  if (config) {
    return {
      ...config,
      canonical: `${SITE_ORIGIN}${path === '/' ? '/' : path}`,
      robots: 'index, follow',
    };
  }

  const noindex = NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  return {
    title: DEFAULT_HOME.title,
    description: DEFAULT_HOME.description,
    canonical: `${SITE_ORIGIN}${path}`,
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
  };
}
