import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
  createTask,
  getProjectTasks,
  getUserProjectTasks,
  updateTask,
  updateTaskStatus,      
  updateHandoverNotes,
  getTaskById,           
  getAssignableMembers,
  deleteTask  // ✅ NEW: Import delete function
} from '../controllers/task-controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

router.use(authenticateToken);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Task not found.
 */
router.delete('/:taskId', deleteTask);

/**
 * @swagger
 * /tasks/{taskId}/handover:
 *   patch:
 *     summary: Update handover notes for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               handoverNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Handover notes updated successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Task not found.
 */
router.patch('/:taskId/handover', updateHandoverNotes);
router.post('/:taskId/handover', updateHandoverNotes);

/**
 * @swagger
 * /tasks/{taskId}/status:
 *   patch:
 *     summary: Update the status of a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task status updated successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Task not found.
 */
router.patch('/:taskId/status', updateTaskStatus);
router.post('/:taskId/status', updateTaskStatus);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Task not found.
 */
router.get('/:taskId', getTaskById);

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Task not found.
 */
router.put('/:taskId', updateTask);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - projectId
 *               - category
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               category:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Project or assignee not found.
 */
router.post('/', createTask);

/**
 * @swagger
 * /tasks/project/{projectId}:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of tasks.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Project not found.
 */
router.get('/project/:projectId', getProjectTasks);

/**
 * @swagger
 * /tasks/project/{projectId}/user:
 *   get:
 *     summary: Get all tasks for the current user in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of tasks.
 *       401:
 *         description: Unauthorized.
 */
router.get('/project/:projectId/user', getUserProjectTasks);

/**
 * @swagger
 * /tasks/project/{projectId}/members:
 *   get:
 *     summary: Get assignable members for a task in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of assignable members.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Project not found.
 */
router.get('/project/:projectId/members', getAssignableMembers);

export default router;
