import React, {
  useState,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom';
import './App.css';
import TaskList from './components/TaskList';

function tasksReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return [
        ...state,
        {
          ...action.payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completed: false,
          subtasks: [],
        },
      ];
    case 'UPDATE_TASK':
      return state.map((task) =>
        task.id === action.payload.id
          ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : task
      );
    case 'DELETE_TASK':
      return state.filter((task) => task.id !== action.payload);
    case 'TOGGLE_TASK':
      return state.map((task) =>
        task.id === action.payload ? { ...task, completed: !task.completed } : task
      );
    case 'ADD_SUBTASK':
      return state.map((task) =>
        task.id === action.payload.taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { ...action.payload.subtask, id: Date.now(), completed: false },
              ],
            }
          : task
      );
    case 'TOGGLE_SUBTASK':
      return state.map((task) => {
        if (task.id === action.payload.taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((st) =>
              st.id === action.payload.subtaskId
                ? { ...st, completed: !st.completed }
                : st
            ),
          };
        }
        return task;
      });
    case 'DELETE_SUBTASK':
      return state.map((task) => {
        if (task.id === action.payload.taskId) {
          return {
            ...task,
            subtasks: task.subtasks.filter((st) => st.id !== action.payload.subtaskId),
          };
        }
        return task;
      });
    default:
      return state;
  }
}

function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, [], () => {
    const stored = localStorage.getItem('tasks');
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [activityLog, setActivityLog] = useState([]);

  const [theme, setTheme] = useState('light');

  const [newTask, setNewTask] = useState({
    text: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    tags: '',
    collaborators: '',
  });
  const inputRef = useRef(null);

  const [reminderTask, setReminderTask] = useState(null);
  useEffect(() => {
    const now = new Date();
    tasks.forEach((task) => {
      if (task.dueDate && !task.completed) {
        const due = new Date(task.dueDate);
        const diff = due - now;
        if (diff > 0 && diff < 3600 * 1000) {
          setReminderTask(task);
        }
      }
    });
  }, [tasks]);

  const [taskDetailModalTask, setTaskDetailModalTask] = useState(null);

  const [filter, setFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('dueDate'); 
  const [searchTerm, setSearchTerm] = useState('');

  const logActivity = useCallback((message) => {
    setActivityLog((prevLogs) => [
      ...prevLogs,
      { id: Date.now(), message, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };
  const addTask = useCallback(() => {
    if (newTask.text.trim()) {
      const task = {
        id: Date.now(),
        text: newTask.text,
        description: newTask.description,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        tags: newTask.tags.split(',').map((t) => t.trim()).filter((t) => t),
        collaborators: newTask.collaborators
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c),
      };
      dispatch({ type: 'ADD_TASK', payload: task });
      logActivity(`Added task: "${newTask.text}"`);
      setNewTask({
        text: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        tags: '',
        collaborators: '',
      });
      inputRef.current.focus();
    }
  }, [newTask, logActivity]);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (filter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    } else if (filter === 'pending') {
      filtered = filtered.filter((t) => !t.completed);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (sortBy === 'dueDate') {
      filtered.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    } else if (sortBy === 'priority') {
      const prioOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);
    }
    return filtered;
  }, [tasks, filter, sortBy, searchTerm]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleTask = useCallback(
    (taskId, taskText, completedStatus) => {
      dispatch({ type: 'TOGGLE_TASK', payload: taskId });
      logActivity(
        `${completedStatus ? 'Reopened' : 'Completed'} task: "${taskText}"`
      );
    },
    [logActivity]
  );

  const deleteTask = useCallback(
    (task) => {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      logActivity(`Deleted task: "${task.text}"`);
    },
    [logActivity]
  );

  const openTaskDetail = useCallback((task) => {
    setTaskDetailModalTask(task);
  }, []);

  return (
    <Router>
      <div className={`app ${theme}`}>
        <header>
          <h1>Task Manager</h1>
          <nav>
            <Link to="/tasks" className="nav-link">
              Tasks
            </Link>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/activity" className="nav-link">
              Activity Log
            </Link>
          </nav>
          <div className="header-actions">
            <button onClick={toggleTheme}>Toggle Theme</button>
          </div>
        </header>

        <Routes>
          <Route
            path="/tasks"
            element={
              <TasksPage
                newTask={newTask}
                handleInputChange={handleInputChange}
                addTask={addTask}
                inputRef={inputRef}
                filter={filter}
                setFilter={setFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredTasks={filteredTasks}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                dispatch={dispatch}
                logActivity={logActivity}
                openTaskDetail={openTaskDetail}
              />
            }
          />
          <Route path="/dashboard" element={<DashboardPage tasks={tasks} />} />
          <Route path="/activity" element={<ActivityLogPage logs={activityLog} />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>

        {taskDetailModalTask && (
          <TaskDetailModal
            task={taskDetailModalTask}
            onClose={() => setTaskDetailModalTask(null)}
          />
        )}

        {reminderTask && (
          <ReminderModal task={reminderTask} onClose={() => setReminderTask(null)} />
        )}

        <footer>
          <p>Multi-Device Sync via LocalStorage (Simulated)</p>
        </footer>
      </div>
    </Router>
  );
}

function TasksPage({
  newTask,
  handleInputChange,
  addTask,
  inputRef,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  searchTerm,
  setSearchTerm,
  filteredTasks,
  toggleTask,
  deleteTask,
  dispatch,
  logActivity,
  openTaskDetail,
}) {
  return (
    <main>
      <section className="task-form">
        <input
          type="text"
          name="text"
          placeholder="Task title..."
          value={newTask.text}
          onChange={handleInputChange}
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTask();
          }}
        />
        <textarea
          name="description"
          placeholder="Task description..."
          value={newTask.description}
          onChange={handleInputChange}
        ></textarea>
        <input
          type="datetime-local"
          name="dueDate"
          value={newTask.dueDate}
          onChange={handleInputChange}
        />
        <select name="priority" value={newTask.priority} onChange={handleInputChange}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma separated)"
          value={newTask.tags}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="collaborators"
          placeholder="Collaborators (comma separated)"
          value={newTask.collaborators}
          onChange={handleInputChange}
        />
        <button onClick={addTask}>Add Task</button>
      </section>

      <section className="filter-sort">
        <div className="filter">
          <label>Filter: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="sort">
          <label>Sort By: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </section>

      <section className="search-bar">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      <TaskList
        tasks={filteredTasks}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        dispatch={dispatch}
        logActivity={logActivity}
        openTaskDetail={openTaskDetail}
      />
    </main>
  );
}

function ActivityLogPage({ logs }) {
  return (
    <main>
      <ActivityLog logs={logs} />
    </main>
  );
}

function ActivityLog({ logs }) {
  return (
    <section className="activity-log">
      <h2>Activity Log</h2>
      {logs.length === 0 ? (
        <p>No recent activity.</p>
      ) : (
        <ul>
          {logs.map((log) => (
            <li key={log.id}>
              <span className="log-message">{log.message}</span>
              <span className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardPage({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const averageProgress =
    total > 0
      ? (
          tasks.reduce((acc, task) => {
            const taskProgress =
              task.subtasks && task.subtasks.length > 0
                ? (task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100
                : task.completed
                ? 100
                : 0;
            return acc + taskProgress;
          }, 0) / total
        ).toFixed(0)
      : 0;

  return (
    <main className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat">
          <h3>Total Tasks</h3>
          <p>{total}</p>
        </div>
        <div className="stat">
          <h3>Completed Tasks</h3>
          <p>{completed}</p>
        </div>
        <div className="stat">
          <h3>Pending Tasks</h3>
          <p>{pending}</p>
        </div>
        <div className="stat">
          <h3>Average Progress</h3>
          <p>{averageProgress}%</p>
        </div>
      </div>
    </main>
  );
}

function TaskDetailModal({ task, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal task-detail-modal">
        <h2>Task Details</h2>
        <p>
          <strong>Title:</strong> {task.text}
        </p>
        <p>
          <strong>Description:</strong>{' '}
          {task.description ? task.description : 'No description provided.'}
        </p>
        {task.dueDate && (
          <p>
            <strong>Due Date:</strong> {new Date(task.dueDate).toLocaleString()}
          </p>
        )}
        <p>
          <strong>Priority:</strong> {task.priority}
        </p>
        {task.tags && task.tags.length > 0 && (
          <p>
            <strong>Tags:</strong> {task.tags.join(', ')}
          </p>
        )}
        {task.collaborators && task.collaborators.length > 0 && (
          <p>
            <strong>Collaborators:</strong> {task.collaborators.join(', ')}
          </p>
        )}
        <p>
          <strong>Created At:</strong> {new Date(task.createdAt).toLocaleString()}
        </p>
        {task.updatedAt && (
          <p>
            <strong>Updated At:</strong> {new Date(task.updatedAt).toLocaleString()}
          </p>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ReminderModal({ task, onClose }) {
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(task.dueDate) - new Date();
      if (diff > 0) {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setRemainingTime('Due!');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [task]);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Reminder</h2>
        <p>
          <strong>Task:</strong> {task.text}
        </p>
        <p>
          <strong>Due in:</strong> {remainingTime}
        </p>
        <div className="modal-actions">
          <button onClick={onClose}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

export default App;
