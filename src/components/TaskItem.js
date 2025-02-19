
import { useState, React }  from "react";

function TaskItem({ task, toggleTask, deleteTask, dispatch, logActivity, openTaskDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    text: task.text,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    tags: task.tags.join(', '),
    collaborators: task.collaborators.join(', '),
  });
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleEditSave = () => {
    const updates = {
      text: editData.text,
      description: editData.description,
      dueDate: editData.dueDate,
      priority: editData.priority,
      tags: editData.tags.split(',').map((t) => t.trim()).filter((t) => t),
      collaborators: editData.collaborators
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c),
    };
    dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates } });
    logActivity(`Updated task: "${editData.text}"`);
    setIsEditing(false);
  };

  const addSubtask = () => {
    if (newSubtaskText.trim()) {
      dispatch({
        type: 'ADD_SUBTASK',
        payload: { taskId: task.id, subtask: { text: newSubtaskText } },
      });
      logActivity(`Added subtask to "${task.text}": "${newSubtaskText}"`);
      setNewSubtaskText('');
      setShowSubtaskForm(false);
    }
  };

  const toggleSubtask = (subtaskId) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId } });
    logActivity(`Toggled subtask for "${task.text}"`);
  };

  const deleteSubtask = (subtaskId) => {
    dispatch({ type: 'DELETE_SUBTASK', payload: { taskId: task.id, subtaskId } });
    logActivity(`Deleted a subtask from "${task.text}"`);
  };

  const progress =
    task.subtasks.length > 0
      ? Math.round(
          (task.subtasks.filter((st) => st.completed).length / task.subtasks.length) *
            100
        )
      : task.completed
      ? 100
      : 0;

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      {isEditing ? (
        <div className="edit-task">
          <input
            type="text"
            value={editData.text}
            onChange={(e) => setEditData({ ...editData, text: e.target.value })}
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          ></textarea>
          <input
            type="datetime-local"
            value={editData.dueDate}
            onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
          />
          <select
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
          />
          <input
            type="text"
            placeholder="Collaborators (comma separated)"
            value={editData.collaborators}
            onChange={(e) => setEditData({ ...editData, collaborators: e.target.value })}
          />
          <button onClick={handleEditSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="task-main">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id, task.text, task.completed)}
            />
            <span
              className="task-text"
              onDoubleClick={() => toggleTask(task.id, task.text, task.completed)}
            >
              {task.text}
            </span>
            {task.dueDate && (
              <small className="due-date">
                (Due: {new Date(task.dueDate).toLocaleString()})
              </small>
            )}
            <small className="priority">[{task.priority}]</small>
            {task.tags && task.tags.length > 0 && (
              <small className="tags">Tags: {task.tags.join(', ')}</small>
            )}
            {task.collaborators && task.collaborators.length > 0 && (
              <small className="collabs">
                Collaborators: {task.collaborators.join(', ')}
              </small>
            )}
          </div>
          <div className="task-actions">
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={() => deleteTask(task)}>Delete</button>
            <button onClick={() => setShowSubtaskForm(!showSubtaskForm)}>
              {showSubtaskForm ? 'Cancel Subtask' : 'Add Subtask'}
            </button>
            <button onClick={() => openTaskDetail(task)}>View Details</button>
          </div>
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="subtasks">
              <p>Progress: {progress}%</p>
              <ul>
                {task.subtasks.map((st) => (
                  <li key={st.id} className={st.completed ? 'completed' : ''}>
                    <span onClick={() => toggleSubtask(st.id)}>{st.text}</span>
                    <button onClick={() => deleteSubtask(st.id)}>x</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showSubtaskForm && (
            <div className="subtask-form">
              <input
                type="text"
                placeholder="Subtask description..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
              />
              <button onClick={addSubtask}>Add</button>
            </div>
          )}
        </>
      )}
      <div className="timestamps">
        <small>Created: {new Date(task.createdAt).toLocaleString()}</small>
        {task.updatedAt && (
          <small>Updated: {new Date(task.updatedAt).toLocaleString()}</small>
        )}
      </div>
    </li>
  );
}

export default TaskItem;