import React, {
  useState,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import './App.css';

// Reducer for task actions
function tasksReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return [
        ...state,
        {
          ...action.payload,
          createdAt: new Date().toISOString(),
          // When first added, no update has occurred yet.
          updatedAt: null,
        },
      ];
    case 'DELETE_TASK':
      return state.filter((task) => task.id !== action.payload);
    case 'TOGGLE_TASK':
      return state.map((task) =>
        task.id === action.payload
          ? { ...task, completed: !task.completed }
          : task
      );
    case 'EDIT_TASK':
      return state.map((task) =>
        task.id === action.payload ? { ...task, editing: true } : task
      );
    case 'CANCEL_EDIT':
      return state.map((task) =>
        task.id === action.payload ? { ...task, editing: false } : task
      );
    case 'UPDATE_TASK':
      return state.map((task) =>
        task.id === action.payload.id
          ? {
              ...task,
              ...action.payload.updates,
              updatedAt: new Date().toISOString(),
              editing: false,
            }
          : task
      );
    default:
      return state;
  }
}

function App() {
  // Manage tasks using useReducer
  const [tasks, dispatch] = useReducer(tasksReducer, [], () => {
    const localData = localStorage.getItem('tasks');
    return localData ? JSON.parse(localData) : [];
  });

  // Persist tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Local state for new task input and filters
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [filter, setFilter] = useState('all'); // "all", "completed", "pending"
  const [searchTerm, setSearchTerm] = useState('');

  // For activity logging (e.g., deletion events)
  const [activityLogs, setActivityLogs] = useState([]);

  // Modal state for viewing task details or confirming deletion
  const [modalTask, setModalTask] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // "view" or "delete"
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useRef for input focus
  const inputRef = useRef(null);

  // --- HANDLERS ---

  // Add new task (using useCallback to memoize)
  const addTask = useCallback(() => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: newTaskText.trim(),
        dueDate: newTaskDueDate,
        priority: newTaskPriority,
        completed: false,
        editing: false,
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
      setNewTaskText('');
      setNewTaskDueDate('');
      setNewTaskPriority('Medium');
      inputRef.current.focus();
    }
  }, [newTaskText, newTaskDueDate, newTaskPriority]);

  // Toggle task completion
  const toggleTask = useCallback((id) => {
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  }, []);

  // Initiate edit mode
  const editTask = useCallback((id) => {
    dispatch({ type: 'EDIT_TASK', payload: id });
  }, []);

  // Cancel edit mode
  const cancelEdit = useCallback((id) => {
    dispatch({ type: 'CANCEL_EDIT', payload: id });
  }, []);

  // Update task details
  const updateTask = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

  // Delete a task (used after confirmation)
  const deleteTask = useCallback(
    (task) => {
      // Log deletion
      setActivityLogs((prevLogs) => [
        ...prevLogs,
        {
          id: task.id,
          text: task.text,
          deletedAt: new Date().toISOString(),
        },
      ]);
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      closeModal();
    },
    [dispatch]
  );

  // Open modal (for viewing details or deletion confirmation)
  const openModal = useCallback((task, mode = 'view') => {
    setModalTask(task);
    setModalMode(mode);
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalTask(null);
    setIsModalOpen(false);
  }, []);

  // Compute filtered tasks with useMemo (by status and search term)
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'completed') {
      filtered = filtered.filter((task) => task.completed);
    } else if (filter === 'pending') {
      filtered = filtered.filter((task) => !task.completed);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter((task) =>
        task.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [tasks, filter, searchTerm]);

  return (
    <div className="container">
      <h1>Full Blown Task Manager</h1>
      <TaskForm
        newTaskText={newTaskText}
        setNewTaskText={setNewTaskText}
        newTaskDueDate={newTaskDueDate}
        setNewTaskDueDate={setNewTaskDueDate}
        newTaskPriority={newTaskPriority}
        setNewTaskPriority={setNewTaskPriority}
        addTask={addTask}
        inputRef={inputRef}
      />
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <TaskList
        tasks={filteredTasks}
        onToggle={toggleTask}
        onEdit={editTask}
        onUpdate={updateTask}
        onCancelEdit={cancelEdit}
        onOpen={openModal}
      />
      {isModalOpen && modalTask && (
        <TaskModal
          task={modalTask}
          mode={modalMode}
          onClose={closeModal}
          onDelete={deleteTask}
        />
      )}
      <ActivityLog logs={activityLogs} />
    </div>
  );
}

// --- COMPONENTS ---

// Form for adding a new task
function TaskForm({
  newTaskText,
  setNewTaskText,
  newTaskDueDate,
  setNewTaskDueDate,
  newTaskPriority,
  setNewTaskPriority,
  addTask,
  inputRef,
}) {
  return (
    <div className="task-input">
      <input
        type="text"
        placeholder="Enter task description..."
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') addTask();
        }}
      />
      <input
        type="datetime-local"
        value={newTaskDueDate}
        onChange={(e) => setNewTaskDueDate(e.target.value)}
      />
      <select
        value={newTaskPriority}
        onChange={(e) => setNewTaskPriority(e.target.value)}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}

// Bar for filtering and searching tasks
function FilterBar({ filter, setFilter, searchTerm, setSearchTerm }) {
  return (
    <div className="filter-bar">
      <button
        className={filter === 'all' ? 'active' : ''}
        onClick={() => setFilter('all')}
      >
        All
      </button>
      <button
        className={filter === 'pending' ? 'active' : ''}
        onClick={() => setFilter('pending')}
      >
        Pending
      </button>
      <button
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilter('completed')}
      >
        Completed
      </button>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}

// List of tasks
function TaskList({
  tasks,
  onToggle,
  onEdit,
  onUpdate,
  onCancelEdit,
  onOpen,
}) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onCancelEdit={onCancelEdit}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );
}

// Individual task item component
function TaskItem({ task, onToggle, onEdit, onUpdate, onCancelEdit, onOpen }) {
  const [editedText, setEditedText] = useState(task.text);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);
  const [editedPriority, setEditedPriority] = useState(task.priority);

  const handleUpdate = () => {
    if (editedText.trim()) {
      onUpdate(task.id, {
        text: editedText,
        dueDate: editedDueDate,
        priority: editedPriority,
      });
    }
  };

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      {task.editing ? (
        <div className="editing-task">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <input
            type="datetime-local"
            value={editedDueDate}
            onChange={(e) => setEditedDueDate(e.target.value)}
          />
          <select
            value={editedPriority}
            onChange={(e) => setEditedPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => onCancelEdit(task.id)}>Cancel</button>
        </div>
      ) : (
        <div className="task-view">
          <div
            className="task-details"
            onClick={() => onToggle(task.id)}
            title="Click to toggle completion"
          >
            <span className="task-text">{task.text}</span>
            {task.dueDate && (
              <small className="due-date">
                {' '}
                (Due: {new Date(task.dueDate).toLocaleString()})
              </small>
            )}
            <small className="priority"> [{task.priority}]</small>
          </div>
          <div className="task-actions">
            <button onClick={() => onEdit(task.id)}>Edit</button>
            {/* Open modal in "view" mode */}
            <button onClick={() => onOpen(task, 'view')}>Open</button>
            {/* Open modal in "delete" mode for confirmation */}
            <button onClick={() => onOpen(task, 'delete')}>Delete</button>
          </div>
        </div>
      )}
    </li>
  );
}

// Modal component for viewing task details and deletion confirmation
function TaskModal({ task, mode, onClose, onDelete }) {
  const [remainingTime, setRemainingTime] = useState('');
  // Update remaining time every second if dueDate exists
  useEffect(() => {
    let interval;
    if (task && task.dueDate) {
      interval = setInterval(() => {
        const diff = new Date(task.dueDate) - new Date();
        if (diff > 0) {
          const seconds = Math.floor((diff / 1000) % 60);
          const minutes = Math.floor((diff / 1000 / 60) % 60);
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setRemainingTime('Time is up!');
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task]);

  if (!task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        {mode === 'view' ? (
          <>
            <h2>Task Details</h2>
            <p>
              <strong>Description:</strong> {task.text}
            </p>
            <p>
              <strong>Priority:</strong> {task.priority}
            </p>
            <p>
              <strong>Created At:</strong>{' '}
              {new Date(task.createdAt).toLocaleString()}
            </p>
            {task.updatedAt && (
              <p>
                <strong>Updated At:</strong>{' '}
                {new Date(task.updatedAt).toLocaleString()}
              </p>
            )}
            {task.dueDate && (
              <>
                <p>
                  <strong>Due Date:</strong>{' '}
                  {new Date(task.dueDate).toLocaleString()}
                </p>
                <p>
                  <strong>Time Remaining:</strong> {remainingTime}
                </p>
              </>
            )}
            <div className="modal-actions">
              <button onClick={onClose}>Close</button>
              <button onClick={() => onDelete(task)}>Delete Task</button>
            </div>
          </>
        ) : (
          <>
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the task:{' '}
              <strong>{task.text}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={onClose}>Cancel</button>
              <button onClick={() => onDelete(task)}>Confirm Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Activity log to show deleted tasks
function ActivityLog({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="activity-log">
      <h2>Activity Log</h2>
      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            Task &quot;{log.text}&quot; was deleted at{' '}
            {new Date(log.deletedAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
