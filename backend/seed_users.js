const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function seed() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres123@localhost:5432/sales_forecasting'
    });

    await client.connect();
    const hash = await bcrypt.hash('password123', 10);

    try {
        await client.query(`
      INSERT INTO users (email, password_hash, role, created_at, updated_at) 
      VALUES 
      ('analyst@example.com', $1, 'analyst', NOW(), NOW()),
      ('admin@example.com', $1, 'admin', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);
        console.log("Mock users created!");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

seed();
