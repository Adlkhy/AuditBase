// Common Supabase / PostgREST table names to probe.
// Inspired by SecLists common-api-endpoints & real-world Supabase project patterns.
export const COMMON_TABLES: string[] = [
  // Auth & Identity
  'users', 'profiles', 'accounts', 'members', 'admins',
  'roles', 'permissions', 'user_roles', 'sessions',
  'tokens', 'api_keys', 'refresh_tokens', 'auth_tokens',

  // Business Core
  'orders', 'order_items', 'products', 'customers', 'invoices',
  'payments', 'subscriptions', 'transactions', 'carts', 'cart_items',
  'pricing', 'plans', 'coupons', 'discounts', 'refunds',

  // Content
  'posts', 'articles', 'comments', 'categories', 'tags',
  'media', 'files', 'documents', 'pages', 'drafts', 'blogs',

  // Social / Messaging
  'messages', 'notifications', 'likes', 'follows', 'friends',
  'reactions', 'chats', 'conversations', 'threads',

  // App / SaaS
  'settings', 'todos', 'tasks', 'events', 'logs', 'audit_logs',
  'activity', 'tickets', 'issues', 'projects', 'teams',
  'organizations', 'workspaces', 'invites', 'feature_flags',

  // Data & Config
  'addresses', 'locations', 'contacts', 'emails',
  'config', 'configurations', 'webhooks', 'integrations',

  // Analytics
  'analytics', 'metrics', 'reports', 'stats', 'tracking',
];
