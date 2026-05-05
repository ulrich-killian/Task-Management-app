import { pool } from '../config/db.js';


const STATUS_TRANSITIONS = {
    'todo':        ['in-progress'],
    'in-progress': ['done', 'todo'],
    'done':        [] 
};

export const getTasks = async (userId, { status, due_before, limit = 10, offset = 0 } = {}) => {
    try {
        let conditions = [`(t.created_by = $1 OR a.assigned_to = $1)`];
        let params = [userId];
        let paramIndex = 2;

        if (status) {
            conditions.push(`t.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (due_before) {
            conditions.push(`t.due_date < $${paramIndex}`);
            params.push(new Date(due_before));
            paramIndex++;
        }

        params.push(parseInt(limit));
        params.push(parseInt(offset));

        const result = await pool.query(`
            SELECT 
                t.*,
                u1.username AS created_by_username,
                u2.username AS assigned_to_username,
                a.assigned_to,
                CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS is_overdue
            FROM tasks t
            LEFT JOIN users u1 ON t.created_by = u1.id
            LEFT JOIN assignments a ON t.id = a.task_id
            LEFT JOIN users u2 ON a.assigned_to = u2.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);


        const countResult = await pool.query(`
            SELECT COUNT(DISTINCT t.id) 
            FROM tasks t
            LEFT JOIN assignments a ON t.id = a.task_id
            WHERE (t.created_by = $1 OR a.assigned_to = $1)
        `, [userId]);

        return {
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
    } catch (error) {
        console.error('Error in getTasks service:', error);
        throw new Error('Failed to fetch tasks');
    }
};

export const getTaskById = async (taskId, userId) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.*,
                u1.username AS created_by_username,
                u2.username AS assigned_to_username,
                a.assigned_to,
                CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS is_overdue
            FROM tasks t
            LEFT JOIN users u1 ON t.created_by = u1.id
            LEFT JOIN assignments a ON t.id = a.task_id
            LEFT JOIN users u2 ON a.assigned_to = u2.id
            WHERE t.id = $1 AND (t.created_by = $2 OR a.assigned_to = $2)
        `, [taskId, userId]);

        if (result.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error in getTaskById service:', error);
        throw error;
    }
};

export const createTask = async ({ title, description, due_date, assigned_to, created_by }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');


        if (due_date && new Date(due_date) <= new Date()) {
            throw new Error('due_date must be a future date');
        }


        if (assigned_to) {
            const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
            if (userCheck.rows.length === 0) {
                throw new Error('Assigned user does not exist');
            }
        }

        const result = await client.query(
            `INSERT INTO tasks (title, description, due_date, created_by, status)
             VALUES ($1, $2, $3, $4, 'todo')
             RETURNING *`,
            [title.trim(), description, due_date, created_by]
        );

        const task = result.rows[0];

        if (assigned_to) {
            await client.query(
                `INSERT INTO assignments (task_id, assigned_to, assigned_by) VALUES ($1, $2, $3)`,
                [task.id, assigned_to, created_by]
            );
        }

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Task created successfully',
            data: task
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in createTask service:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const updateTask = async (taskId, userId, { title, description, due_date, status, assigned_to }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check ownership
        const taskCheck = await client.query(
            `SELECT t.*, a.assigned_to as assignee
             FROM tasks t
             LEFT JOIN assignments a ON t.id = a.task_id
             WHERE t.id = $1 AND (t.created_by = $2 OR a.assigned_to = $2)`,
            [taskId, userId]
        );

        if (taskCheck.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }

        const currentTask = taskCheck.rows[0];


        if (status && status !== currentTask.status) {
            const allowed = STATUS_TRANSITIONS[currentTask.status] || [];
            if (!allowed.includes(status)) {
                throw new Error(`Invalid status transition from '${currentTask.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`);
            }
        }


        if (due_date && new Date(due_date) <= new Date()) {
            throw new Error('due_date must be a future date');
        }

        const completedAt = status === 'done' ? 'CURRENT_TIMESTAMP' : 'completed_at';

        const result = await client.query(
            `UPDATE tasks SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                due_date = COALESCE($3, due_date),
                status = COALESCE($4, status),
                updated_at = CURRENT_TIMESTAMP,
                completed_at = CASE WHEN $4 = 'done' THEN CURRENT_TIMESTAMP ELSE completed_at END
             WHERE id = $5
             RETURNING *`,
            [title, description, due_date, status, taskId]
        );


        if (assigned_to !== undefined && currentTask.created_by === userId) {
            await client.query(`DELETE FROM assignments WHERE task_id = $1`, [taskId]);
            if (assigned_to) {
                const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
                if (userCheck.rows.length === 0) throw new Error('Assigned user does not exist');
                await client.query(
                    `INSERT INTO assignments (task_id, assigned_to, assigned_by) VALUES ($1, $2, $3)`,
                    [taskId, assigned_to, userId]
                );
            }
        }

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Task updated successfully',
            data: result.rows[0]
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in updateTask service:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const completeTask = async (taskId, userId) => {
    try {

        const taskCheck = await pool.query(
            `SELECT t.* FROM tasks t
             LEFT JOIN assignments a ON t.id = a.task_id
             WHERE t.id = $1 AND (t.created_by = $2 OR a.assigned_to = $2)`,
            [taskId, userId]
        );

        if (taskCheck.rows.length === 0) {
            throw new Error('Task not found or access denied');
        }

        if (taskCheck.rows[0].status === 'done') {
            throw new Error('Task is already completed');
        }

        const result = await pool.query(
            `UPDATE tasks 
             SET status = 'done', updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [taskId]
        );

        return {
            success: true,
            message: 'Task marked as done',
            data: result.rows[0]
        };
    } catch (error) {
        console.error('Error in completeTask service:', error);
        throw error;
    }
};

export const deleteTask = async (taskId, userId) => {
    try {

        const result = await pool.query(
            `DELETE FROM tasks WHERE id = $1 AND created_by = $2 RETURNING id`,
            [taskId, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Task not found or you are not the creator');
        }

        return {
            success: true,
            message: 'Task deleted successfully',
            deletedTaskId: result.rows[0].id
        };
    } catch (error) {
        console.error('Error in deleteTask service:', error);
        throw error;
    }
};