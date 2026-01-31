// Node.js script to make a user superadmin
// Usage: DATABASE_URL=postgresql://... SUPERADMIN_EMAIL=email@example.com node make_superadmin_node.js
// OR: node make_superadmin_node.js postgresql://... email@example.com
const { Client } = require("pg");

// Get database URL from environment variable or command line argument
const databaseUrl = process.env.DATABASE_URL || process.argv[2];
if (!databaseUrl) {
  console.error(
    "❌ DATABASE_URL not set. Please set it as environment variable or pass as argument:",
  );
  console.error(
    "   DATABASE_URL=postgresql://user:password@host:port/database node make_superadmin_node.js",
  );
  console.error("   OR");
  console.error(
    "   node make_superadmin_node.js postgresql://user:password@host:port/database email@example.com",
  );
  process.exit(1);
}

// Get email from environment variable or command line argument
const email =
  process.env.SUPERADMIN_EMAIL || process.argv[3] || "clement@nukleo.com";
if (!process.env.SUPERADMIN_EMAIL && !process.argv[3]) {
  console.warn(`⚠️  Using default email: ${email}`);
  console.warn(
    "   Set SUPERADMIN_EMAIL environment variable or pass as second argument to use different email",
  );
}

async function makeSuperAdmin() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");
    console.log(`🔧 Making '${email}' superadmin...\n`);

    // Step 1: Ensure superadmin role exists
    await client.query(`
      INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
      VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `);
    console.log("✅ Superadmin role ensured");

    // Step 2: Add superadmin role to user
    const insertResult = await client.query(
      `
      INSERT INTO user_roles (user_id, role_id, created_at)
      SELECT u.id, r.id, NOW()
      FROM users u
      CROSS JOIN roles r
      WHERE u.email = $1
        AND r.slug = 'superadmin'
      ON CONFLICT (user_id, role_id) DO NOTHING
    `,
      [email],
    );

    if (insertResult.rowCount === 0) {
      console.log(`⚠️  User '${email}' already has superadmin role`);
    } else {
      console.log(`✅ Added superadmin role to '${email}'`);
    }

    // Step 3: Verify
    const verifyResult = await client.query(
      `
      SELECT 
        u.email,
        u.id as user_id,
        r.name as role_name,
        r.slug as role_slug,
        ur.created_at as role_assigned_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND r.slug = 'superadmin'
    `,
      [email],
    );

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0];
      console.log(`\n✅ Verification successful:`);
      console.log(`   Email: ${row.email}`);
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   Role: ${row.role_name} (${row.role_slug})`);
      console.log(`   Assigned at: ${row.role_assigned_at}`);
    } else {
      console.log(
        `\n⚠️  Warning: Could not verify superadmin role for '${email}'`,
      );
    }

    console.log("\n✅ Done! User is now a superadmin.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("   Connection refused. Check database URL and network.");
    } else if (error.code === "28P01") {
      console.error("   Authentication failed. Check credentials.");
    } else if (error.code === "3D000") {
      console.error("   Database does not exist.");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

makeSuperAdmin();
