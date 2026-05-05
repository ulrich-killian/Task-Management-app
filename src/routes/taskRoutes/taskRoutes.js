import express from 'express';
import { 
    getTasks,
    getTasksById, 
    createTask, 
    updateTaskStatus, 
    completeTask,
    deleteTask 
} from '../../controllers/taskController.js';
import { protect } from '../../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/', protect, getTasks);
router.post('/', protect, createTask);
router.get('/:id', protect, getTasksById);
router.put('/:id', protect, updateTaskStatus);
router.patch('/:id/complete', protect, completeTask);
router.delete('/:id', protect, deleteTask);

export default router;
