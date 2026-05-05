import * as taskService from '../service/taskService.js';

export const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, due_before, limit, offset } = req.query;

        const tasks = await taskService.getTasks(userId, { status, due_before, limit, offset });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Get tasks controller error:', error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

export const getTasksById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Valid task ID is required' });
    }

    try {
        const task = await taskService.getTaskById(id, userId);
        res.status(200).json(task);
    } catch (error) {
        console.error('Get task by ID controller error:', error);
        if (error.message.includes('not found') || error.message.includes('access denied')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error fetching task', error: error.message });
    }
};

export const createTask = async (req, res) => {
    const { title, description, due_date, assigned_to } = req.body;
    const created_by = req.user?.id;

    if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' });
    }

    if (!created_by) {
        return res.status(401).json({ message: 'User authentication required' });
    }

    try {
        const result = await taskService.createTask({ title, description, due_date, assigned_to, created_by });
        res.status(201).json(result);
    } catch (error) {
        console.error('Create task controller error:', error);
        if (error.message.includes('future date') || error.message.includes('does not exist')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
};

export const updateTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, due_date, status, assigned_to } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Valid task ID is required' });
    }

    const validStatuses = ['todo', 'in-progress', 'done'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const result = await taskService.updateTask(id, userId, { title, description, due_date, status, assigned_to });
        res.status(200).json(result);
    } catch (error) {
        console.error('Update task controller error:', error);
        if (error.message.includes('not found') || error.message.includes('access denied')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('transition') || error.message.includes('future date') || error.message.includes('does not exist')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

export const completeTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Valid task ID is required' });
    }

    try {
        const result = await taskService.completeTask(id, userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Complete task controller error:', error);
        if (error.message.includes('not found') || error.message.includes('access denied')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('already completed')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error completing task', error: error.message });
    }
};

export const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Valid task ID is required' });
    }

    try {
        const result = await taskService.deleteTask(id, userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Delete task controller error:', error);
        if (error.message.includes('not found') || error.message.includes('creator')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};