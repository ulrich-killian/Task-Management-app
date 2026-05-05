import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date TIMESTAMP,
                status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, assigned_to)
            );
        `);

        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
};

const addTestData = async () => {
    try {

        const existing = await pool.query(`SELECT id FROM users WHERE email IN ('alice@example.com', 'bob@example.com', 'charlie@example.com')`);
        if (existing.rows.length > 0) {
            console.log('Test data already exists, skipping seed');
            return;
        }


        const password1 = await bcrypt.hash('password123', 10);
        const password2 = await bcrypt.hash('password456', 10);
        const password3 = await bcrypt.hash('password789', 10);


        const user1 = await pool.query(
            `INSERT INTO users (username, email, password_hash) VALUES ('alice', 'alice@example.com', $1) RETURNING id`, [password1]
        );
        const user2 = await pool.query(
            `INSERT INTO users (username, email, password_hash) VALUES ('bob', 'bob@example.com', $1) RETURNING id`, [password2]
        );
        const user3 = await pool.query(
            `INSERT INTO users (username, email, password_hash) VALUES ('charlie', 'charlie@example.com', $1) RETURNING id`, [password3]
        );

        const u1 = user1.rows[0].id;
        const u2 = user2.rows[0].id;
        const u3 = user3.rows[0].id;

        const tasks = await pool.query(`
            INSERT INTO tasks (title, description, due_date, status, created_by) VALUES
            ('Design landing page',     'Create wireframes and mockups',         NOW() + INTERVAL '3 days',  'todo',        $1),
            ('Set up CI/CD pipeline',   'Configure GitHub Actions',              NOW() + INTERVAL '5 days',  'todo',        $2),
            ('Write unit tests',        'Cover auth and task endpoints',         NOW() + INTERVAL '7 days',  'in-progress', $1),
            ('Database optimization',   'Add indexes to tasks table',            NOW() + INTERVAL '2 days',  'in-progress', $3),
            ('API documentation',       'Document all endpoints with Swagger',   NOW() + INTERVAL '4 days',  'todo',        $2),
            ('Fix login bug',           'Users getting 401 on valid tokens',     NOW() + INTERVAL '1 day',   'in-progress', $1),
            ('Deploy to production',    'Deploy app to Fly.io',                  NOW() + INTERVAL '10 days', 'todo',        $3),
            ('Code review',             'Review PR for task management feature', NOW() - INTERVAL '1 day',   'done',        $2),
            ('Update dependencies',     'Bump all npm packages to latest',       NOW() - INTERVAL '2 days',  'done',        $1),
            ('Security audit',          'Check for SQL injection vulnerabilities',NOW() + INTERVAL '6 days', 'todo',        $3)
            RETURNING id
        `, [u1, u2, u3]);

        const taskIds = tasks.rows.map(r => r.id);


        await pool.query(`
            INSERT INTO assignments (task_id, assigned_to, assigned_by) VALUES
            ($1, $4, $5),
            ($2, $5, $4),
            ($3, $6, $4),
            ($4, $4, $6),
            ($5, $5, $6)
        `, [taskIds[0], taskIds[1], taskIds[2], u2, u1, u3]);

        console.log('Test data seeded successfully — 3 users, 10 tasks, 5 assignments');
    } catch (error) {
        console.error('Error adding test data:', error);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    await createTables();
    await addTestData();
}

export { createTables, addTestData };