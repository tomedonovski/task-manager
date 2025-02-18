import React, {
  useState,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import './App.css';

function tasksReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return [...state, action.payload];
    case 'DELETE_TASK':
      return state.filter((task) => task.id !== action.payload);
    case 'TOGGLE_TASK':
      return state.map((task) =>
        task.id === action.payload ? { ...task, completed: !task.completed } : task
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
          ? { ...task, ...action.payload.updates, editing: false }
          : task
      );
    default:
      return state;
  }
}

function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, [], () => {
    const localData = localStorage.getItem('tasks');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [filter, setFilter] = useState('all'); // "all", "completed", "pending"
  const [searchTerm, setSearchTerm] = useState('');

  const inputRef = useRef(null);

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

  const toggleTask = useCallback((id) => {
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  }, []);

  const deleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const editTask = useCallback((id) => {
    dispatch({ type: 'EDIT_TASK', payload: id });
  }, []);

  const cancelEdit = useCallback((id) => {
    dispatch({ type: 'CANCEL_EDIT', payload: id });
  }, []);

  const updateTask = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

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
        onDelete={deleteTask}
        onEdit={editTask}
        onUpdate={updateTask}
        onCancelEdit={cancelEdit}
      />
    </div>
  );
}

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

function TaskList({ tasks, onToggle, onDelete, onEdit, onUpdate, onCancelEdit }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </ul>
  );
}

function TaskItem({ task, onToggle, onDelete, onEdit, onUpdate, onCancelEdit }) {
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
          <div className="task-details" onClick={() => onToggle(task.id)}>
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
            <button onClick={() => onDelete(task.id)}>Delete</button>
          </div>
        </div>
      )}
    </li>
  );
}

export default App;
