require('dotenv').config();
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = createClient({
  url: process.env.DATABASE_URL || `file:${path.join(__dirname, 'taskflow.db')}`,
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

// ─── Demo data ───────────────────────────────────────────────────────────────
const DEMO_EMAIL    = 'demo@projecthub.app';
const DEMO_PASSWORD = 'demo123';

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Ensure tables exist ────────────────────────────────────────────────
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      admin_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      assignee_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // ── 2. Users ──────────────────────────────────────────────────────────────
  const users = [
    { id: uuidv4(), name: 'ProjectHub Demo', email: 'demo@projecthub.app', password: DEMO_PASSWORD },
    { id: uuidv4(), name: 'Alice Johnson',  email: 'alice@taskflow.app',  password: 'alice123'    },
    { id: uuidv4(), name: 'Bob Martinez',   email: 'bob@taskflow.app',    password: 'bob123'      },
    { id: uuidv4(), name: 'Carol Williams', email: 'carol@taskflow.app',  password: 'carol123'    },
  ];

  const userMap = {};
  for (const u of users) {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [u.email] });
    if (existing.rows.length > 0) {
      userMap[u.email] = existing.rows[0].id;
      console.log(`  ⏭  User already exists: ${u.email}`);
    } else {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
        args: [u.id, u.name, u.email, hashed],
      });
      userMap[u.email] = u.id;
      console.log(`  ✅ Created user: ${u.name} (${u.email})`);
    }
  }

  const demoId  = userMap['demo@projecthub.app'];
  const aliceId = userMap['alice@taskflow.app'];
  const bobId   = userMap['bob@taskflow.app'];
  const carolId = userMap['carol@taskflow.app'];

  // ── 3. Projects ───────────────────────────────────────────────────────────
  const projects = [
    {
      id: uuidv4(),
      name: 'Website Redesign',
      description: 'Full redesign of the company marketing website with modern UI/UX',
      admin_id: demoId,
      members: [
        { user_id: demoId,  role: 'admin'  },
        { user_id: aliceId, role: 'member' },
        { user_id: bobId,   role: 'member' },
      ],
    },
    {
      id: uuidv4(),
      name: 'Mobile App v2.0',
      description: 'Next-generation mobile application with offline support and push notifications',
      admin_id: demoId,
      members: [
        { user_id: demoId,  role: 'admin'  },
        { user_id: carolId, role: 'member' },
        { user_id: aliceId, role: 'member' },
      ],
    },
    {
      id: uuidv4(),
      name: 'API Integration',
      description: 'Third-party API integrations for payments, analytics and CRM',
      admin_id: aliceId,
      members: [
        { user_id: aliceId, role: 'admin'  },
        { user_id: demoId,  role: 'member' },
        { user_id: bobId,   role: 'member' },
        { user_id: carolId, role: 'member' },
      ],
    },
  ];

  const projectIds = [];

  for (const p of projects) {
    const existing = await db.execute({ sql: 'SELECT id FROM projects WHERE name = ? AND admin_id = ?', args: [p.name, p.admin_id] });
    if (existing.rows.length > 0) {
      const existingId = existing.rows[0].id;
      projectIds.push(existingId);
      console.log(`\n  ⏭  Project already exists: ${p.name}`);
      continue;
    }

    await db.execute({
      sql: 'INSERT INTO projects (id, name, description, admin_id) VALUES (?, ?, ?, ?)',
      args: [p.id, p.name, p.description, p.admin_id],
    });
    projectIds.push(p.id);
    console.log(`\n  📁 Created project: ${p.name}`);

    for (const m of p.members) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        args: [p.id, m.user_id, m.role],
      });
    }
    console.log(`     Added ${p.members.length} members`);
  }

  const [websiteId, mobileId, apiId] = projectIds;

  // ── 4. Tasks ──────────────────────────────────────────────────────────────
  const tasks = [
    // ── Website Redesign ────────────────────────────────────────────────────
    { project_id: websiteId, title: 'Wireframe homepage layout',          description: 'Create low-fidelity wireframes for the new homepage in Figma',              due_date: daysFromNow(-5),  priority: 'high',   status: 'done',        assignee_id: aliceId, created_by: demoId  },
    { project_id: websiteId, title: 'Design system & color palette',      description: 'Define typography, colors, spacing tokens and component library',           due_date: daysFromNow(-2),  priority: 'high',   status: 'done',        assignee_id: demoId,  created_by: demoId  },
    { project_id: websiteId, title: 'Implement responsive navbar',        description: 'Build sticky navigation with mobile hamburger menu',                        due_date: daysFromNow(2),   priority: 'high',   status: 'in_progress', assignee_id: bobId,   created_by: demoId  },
    { project_id: websiteId, title: 'Hero section animations',            description: 'Add scroll-triggered animations using GSAP for the hero section',           due_date: daysFromNow(4),   priority: 'medium', status: 'in_progress', assignee_id: aliceId, created_by: demoId  },
    { project_id: websiteId, title: 'SEO meta tags & Open Graph',         description: 'Add meta descriptions, OG tags and structured data to all pages',          due_date: daysFromNow(7),   priority: 'medium', status: 'todo',        assignee_id: demoId,  created_by: demoId  },
    { project_id: websiteId, title: 'Contact form with validation',       description: 'Build contact form with client + server-side validation and email sending', due_date: daysFromNow(10),  priority: 'low',    status: 'todo',        assignee_id: bobId,   created_by: demoId  },
    { project_id: websiteId, title: 'Performance audit & optimisation',   description: 'Achieve Lighthouse score > 90 on all metrics',                             due_date: daysFromNow(-3),  priority: 'high',   status: 'in_progress', assignee_id: demoId,  created_by: aliceId },
    { project_id: websiteId, title: 'Cross-browser testing',              description: 'Test on Chrome, Firefox, Safari and Edge. Fix any visual bugs.',           due_date: daysFromNow(-8),  priority: 'medium', status: 'todo',        assignee_id: aliceId, created_by: demoId  },

    // ── Mobile App v2.0 ─────────────────────────────────────────────────────
    { project_id: mobileId,  title: 'Offline data sync architecture',     description: 'Design and implement SQLite-based offline sync with conflict resolution',   due_date: daysFromNow(-1),  priority: 'high',   status: 'in_progress', assignee_id: carolId, created_by: demoId  },
    { project_id: mobileId,  title: 'Push notification service',          description: 'Integrate FCM for Android and APNs for iOS push notifications',             due_date: daysFromNow(5),   priority: 'high',   status: 'todo',        assignee_id: demoId,  created_by: demoId  },
    { project_id: mobileId,  title: 'Biometric authentication',           description: 'Add Face ID / fingerprint login using expo-local-authentication',          due_date: daysFromNow(8),   priority: 'medium', status: 'todo',        assignee_id: aliceId, created_by: demoId  },
    { project_id: mobileId,  title: 'Dark mode support',                  description: 'Implement system-aware dark/light theme switching across all screens',      due_date: daysFromNow(-6),  priority: 'medium', status: 'done',        assignee_id: carolId, created_by: demoId  },
    { project_id: mobileId,  title: 'App Store screenshots & metadata',   description: 'Prepare store listing assets, descriptions and screenshots for submission', due_date: daysFromNow(14),  priority: 'low',    status: 'todo',        assignee_id: demoId,  created_by: carolId },
    { project_id: mobileId,  title: 'Beta testing on TestFlight',         description: 'Distribute to 50 beta testers and collect feedback via TestFlight',        due_date: daysFromNow(-10), priority: 'high',   status: 'done',        assignee_id: aliceId, created_by: demoId  },
    { project_id: mobileId,  title: 'Crash analytics integration',        description: 'Integrate Sentry for real-time crash reporting and performance monitoring', due_date: daysFromNow(3),   priority: 'medium', status: 'in_progress', assignee_id: demoId,  created_by: demoId  },

    // ── API Integration ──────────────────────────────────────────────────────
    { project_id: apiId,     title: 'Stripe payment gateway',             description: 'Integrate Stripe Checkout for subscription billing and one-time payments',  due_date: daysFromNow(-4),  priority: 'high',   status: 'done',        assignee_id: demoId,  created_by: aliceId },
    { project_id: apiId,     title: 'Google Analytics 4 setup',           description: 'Configure GA4 events, conversions and custom dimensions',                  due_date: daysFromNow(-7),  priority: 'medium', status: 'done',        assignee_id: bobId,   created_by: aliceId },
    { project_id: apiId,     title: 'HubSpot CRM sync',                   description: 'Sync contacts and deal stages between app and HubSpot CRM via webhooks',   due_date: daysFromNow(1),   priority: 'high',   status: 'in_progress', assignee_id: carolId, created_by: aliceId },
    { project_id: apiId,     title: 'Webhook event logging',              description: 'Build webhook receiver with signature validation and idempotency keys',     due_date: daysFromNow(6),   priority: 'medium', status: 'in_progress', assignee_id: demoId,  created_by: aliceId },
    { project_id: apiId,     title: 'Rate limiting & API docs',           description: 'Add Redis-based rate limiting and generate OpenAPI 3.0 docs with Swagger',  due_date: daysFromNow(12),  priority: 'low',    status: 'todo',        assignee_id: bobId,   created_by: aliceId },
    { project_id: apiId,     title: 'OAuth 2.0 social login',             description: 'Implement Google and GitHub OAuth 2.0 sign-in flows',                      due_date: daysFromNow(-9),  priority: 'high',   status: 'todo',        assignee_id: demoId,  created_by: aliceId },
    { project_id: apiId,     title: 'Email transactional service',        description: 'Set up Resend/SendGrid for transactional emails with branded templates',   due_date: daysFromNow(9),   priority: 'medium', status: 'todo',        assignee_id: carolId, created_by: aliceId },
  ];

  let created = 0;
  let skipped = 0;
  for (const t of tasks) {
    const existing = await db.execute({
      sql: 'SELECT id FROM tasks WHERE title = ? AND project_id = ?',
      args: [t.title, t.project_id],
    });
    if (existing.rows.length > 0) { skipped++; continue; }

    await db.execute({
      sql: `INSERT INTO tasks (id, project_id, title, description, due_date, priority, status, assignee_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), t.project_id, t.title, t.description, t.due_date, t.priority, t.status, t.assignee_id, t.created_by],
    });
    created++;
  }

  console.log(`\n  📋 Tasks: ${created} created, ${skipped} already existed`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed complete!

  Login credentials:
  📧  Email:    demo@taskflow.app
  🔑  Password: demo123

  Team members also created:
  📧  alice@taskflow.app  / alice123
  📧  bob@taskflow.app    / bob123
  📧  carol@taskflow.app  / carol123

  Projects seeded:  3
  Tasks seeded:     ${created}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
