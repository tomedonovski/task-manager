import React from "react";
import TaskItem from "./TaskItem";

function TaskList({ tasks, toggleTask, deleteTask, dispatch, logActivity, openTaskDetail }) {
    return (
        <ul class name="task-list"> {
            tasks.map(task => (
                <TaskItem 
                    key={task.id} 
                    task={task} 
                    toggleTask={toggleTask} 
                    deleteTask={deleteTask} 
                    dispatch={dispatch} 
                    logActivity={logActivity} 
                    openTaskDetail={openTaskDetail}
                />
            ))
        }
        </ul>
    );
}

export default TaskList;