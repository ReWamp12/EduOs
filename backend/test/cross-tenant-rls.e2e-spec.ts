import { Client } from 'pg';

describe('Part 7 §7.2 QA Suite: Automated Cross-Tenant Database Isolation (RLS)', () => {
  let client: Client;
  const TENANT_ALPHA_ID = '247afd96-506e-494c-a603-510b44316919'; // Greenfield High
  const TENANT_BETA_ID = '11111111-2222-3333-4444-555555555555';  // Fictitious Tenant Beta
  const ACTOR_ALPHA_ID = '2e4e2df7-6730-4c99-b36a-a1e25208234c';  // Alpha Principal
  const ACTOR_BETA_ID = '99999999-8888-7777-6666-555555555555';   // Beta Principal

  let testBetaNoticeId: string;
  let testBetaJobId: string;
  let testBetaFeeInvoiceId: string;

  beforeAll(async () => {
    client = new Client({
      host: process.env.DB_HOST || 'db.opfmpmymtpbqeriwjmts.supabase.co',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ReWamp@2026',
      database: process.env.DB_NAME || 'postgres',
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 1. Ensure Tenant Beta exists in tenants table for foreign key integrity
    await client.query(`
      INSERT INTO tenants (id, name, subdomain, institution_type)
      VALUES ('${TENANT_BETA_ID}', 'Tenant Beta Academy', 'tenant-beta', 'school')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Ensure User Profile for Beta Principal exists
    await client.query(`
      INSERT INTO user_profiles (id, tenant_id, email, first_name, last_name, role)
      VALUES ('${ACTOR_BETA_ID}', '${TENANT_BETA_ID}', 'beta_principal@test.edu', 'Beta', 'Principal', 'principal')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Seed test records belonging strictly to Tenant Beta (as superuser bypass for seeding)
    const noticeRes = await client.query(`
      INSERT INTO notices (tenant_id, title, content, category, target_role, created_by)
      VALUES ('${TENANT_BETA_ID}', 'CONFIDENTIAL_BETA_CIRCULAR', 'Beta Private Info', 'general', 'all', '${ACTOR_BETA_ID}')
      RETURNING id;
    `);
    testBetaNoticeId = noticeRes.rows[0].id;

    const jobRes = await client.query(`
      INSERT INTO job_openings (tenant_id, title, department, employment_type, experience_required, status)
      VALUES ('${TENANT_BETA_ID}', 'CONFIDENTIAL_BETA_OPENING', 'Physics', 'full_time', '5 yrs', 'published')
      RETURNING id;
    `);
    testBetaJobId = jobRes.rows[0].id;

    const invRes = await client.query(`
      INSERT INTO fee_invoices (tenant_id, invoice_number, student_name, roll_number, batch_name, title, amount, due_date, status)
      VALUES ('${TENANT_BETA_ID}', 'INV-BETA-001', 'Beta Student', '9901', 'Class 10-B', 'CONFIDENTIAL_BETA_FEE', 25000, CURRENT_DATE + 30, 'pending')
      RETURNING id;
    `);
    testBetaFeeInvoiceId = invRes.rows[0].id;
  }, 30000);

  afterAll(async () => {
    // Teardown seeded test records
    await client.query(`DELETE FROM fee_invoices WHERE tenant_id = '${TENANT_BETA_ID}'`);
    await client.query(`DELETE FROM job_openings WHERE tenant_id = '${TENANT_BETA_ID}'`);
    await client.query(`DELETE FROM notices WHERE tenant_id = '${TENANT_BETA_ID}'`);
    await client.query(`DELETE FROM user_profiles WHERE id = '${ACTOR_BETA_ID}'`);
    await client.query(`DELETE FROM tenants WHERE id = '${TENANT_BETA_ID}'`);
    await client.end();
  });

  /**
   * Helper to simulate an authenticated PostgreSQL session for a given tenant & actor role
   */
  async function asTenantSession(tenantId: string, actorId: string, role: string, callback: () => Promise<void>) {
    await client.query('BEGIN');
    try {
      const jwtClaims = JSON.stringify({
        sub: actorId,
        role: 'authenticated',
        app_metadata: { role, tenant_id: tenantId },
        user_metadata: { role, tenant_id: tenantId },
      });

      await client.query(`SET LOCAL ROLE authenticated;`);
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [jwtClaims]);
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [tenantId]);

      await callback();
    } finally {
      await client.query('ROLLBACK');
    }
  }

  describe('1. Cross-Tenant SELECT Isolation', () => {
    it('Tenant Alpha CANNOT read Tenant Beta notices', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'principal', async () => {
        const res = await client.query(`SELECT * FROM notices WHERE id = $1`, [testBetaNoticeId]);
        expect(res.rows.length).toBe(0);
      });
    });

    it('Tenant Alpha CANNOT read Tenant Beta job openings', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'hr_manager', async () => {
        const res = await client.query(`SELECT * FROM job_openings WHERE id = $1`, [testBetaJobId]);
        expect(res.rows.length).toBe(0);
      });
    });

    it('Tenant Alpha CANNOT read Tenant Beta fee invoices', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'finance', async () => {
        const res = await client.query(`SELECT * FROM fee_invoices WHERE id = $1`, [testBetaFeeInvoiceId]);
        expect(res.rows.length).toBe(0);
      });
    });
  });

  describe('2. Cross-Tenant UPDATE / DELETE Prevention', () => {
    it('Tenant Alpha CANNOT update Tenant Beta notices', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'principal', async () => {
        const updateRes = await client.query(
          `UPDATE notices SET title = 'ATTACK_HIJACKED' WHERE id = $1 RETURNING id`,
          [testBetaNoticeId]
        );
        expect(updateRes.rows.length).toBe(0);
      });
    });

    it('Tenant Alpha CANNOT delete Tenant Beta job openings', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'hr_manager', async () => {
        const delRes = await client.query(
          `DELETE FROM job_openings WHERE id = $1 RETURNING id`,
          [testBetaJobId]
        );
        expect(delRes.rows.length).toBe(0);
      });
    });
  });

  describe('3. Cross-Tenant INSERT Spoofing Prevention', () => {
    it('Tenant Alpha CANNOT insert records targeting Tenant Beta', async () => {
      await asTenantSession(TENANT_ALPHA_ID, ACTOR_ALPHA_ID, 'principal', async () => {
        // Attempting to inject a row with tenant_id = TENANT_BETA_ID while authenticated as Tenant Alpha
        await expect(
          client.query(`
            INSERT INTO notices (tenant_id, title, content, category, target_role, created_by)
            VALUES ('${TENANT_BETA_ID}', 'MALICIOUS_INJECTION', 'Cross Tenant Attack', 'general', 'all', '${ACTOR_ALPHA_ID}')
          `)
        ).rejects.toThrow();
      });
    });
  });
});
