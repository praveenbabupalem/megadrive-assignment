// TaskList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from './TaskForm';
import "./tasklist.css"

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState('');
    const [editingTaskStatus, setEditingTaskStatus] = useState('pending');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8000/tasks', {
                    headers: { Authorization: token }
                });
                setTasks(response.data);
            } catch (error) {
                console.error('Error fetching tasks:', error.response?.data || error.message);
            }
        };

        fetchTasks();
    }, [tasks]);

    const handleDeleteTask = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/tasks/${id}`, {
                headers: { Authorization: token }
            });
            setTasks(tasks.filter(task => task.id !== id));
        } catch (error) {
            console.error('Error deleting task:', error.response?.data || error.message);
        }
    };

    const handleEditTask = (task) => {
        setEditingTaskId(task.id);
        setEditingTaskTitle(task.title);
        setEditingTaskStatus(task.status); // Set current status for editing
    };

    const handleSaveEdit = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8000/tasks/${id}`, { 
                title: editingTaskTitle, 
                status: editingTaskStatus // Send the new status along with the title
            }, {
                headers: { Authorization: token }
            });
            setTasks(tasks.map(task => (task.id === id ? { ...task, title: editingTaskTitle, status: editingTaskStatus } : task)));
            setEditingTaskId(null); // Clear editing state
            setEditingTaskTitle(''); // Clear input
            setEditingTaskStatus('pending'); // Reset status
        } catch (error) {
            console.error('Error updating task:', error.response?.data || error.message);
        }
    };

    const handleStatusChange = (id, status) => {
        setEditingTaskStatus(status);
    };

    return (
        <div className="task-list-container">
           
        <div className="task-list">
            <h2>Your Tasks</h2>
            <TaskForm onTaskAdded={(task) => setTasks([...tasks, task])} />
            <ul>
                {tasks.map((task) => (
                    <li key={task.id}>
                        {editingTaskId === task.id ? (
                            <div>
                                <input
                                    type="text"
                                    value={editingTaskTitle}
                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                />
                                <select 
                                    value={editingTaskStatus} 
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="done">Done</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <button onClick={() => handleSaveEdit(task.id)}>Save</button>
                                <button onClick={() => setEditingTaskId(null)}>Cancel</button>
                            </div>
                        ) : (
                            <div>
                                <span>{task.title}</span>
                                <button className="status-button">
    {task.status}
</button>
                                <button onClick={() => handleEditTask(task)}>Edit</button>
                                <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    </div>
    );
}

export default TaskList;
