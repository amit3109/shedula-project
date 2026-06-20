package com.taskflow.taskflow.service;

import com.taskflow.taskflow.model.Project;
import com.taskflow.taskflow.model.Task;
import com.taskflow.taskflow.repository.ProjectRepository;
import com.taskflow.taskflow.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public Task createTask(Long projectId, Task task) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        task.setProject(project);

        // 🚀 NEW SAFEGUARD: If no priority is sent, default it to "Medium"
        if (task.getPriority() == null) {
            task.setPriority("Medium");
        }

        return taskRepository.save(task);
    }

    public List<Task> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    // 🚀 THE MOVER: Finds the task and updates its status column
    public Task updateTaskStatus(Long taskId, String newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus(newStatus);
        return taskRepository.save(task);
    }

    // 🗑️ Delete a Task
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        taskRepository.delete(task);
    }

    // 📝 THE EDITOR: Updates task details (Description, Due Date, Priority)
    public Task updateTaskDetails(Long taskId, Task updatedTask) {
        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Overwrite the old details with the new ones
        existingTask.setDescription(updatedTask.getDescription());
        existingTask.setDueDate(updatedTask.getDueDate());
        existingTask.setPriority(updatedTask.getPriority());

        existingTask.setAssignedTo(updatedTask.getAssignedTo());
        return taskRepository.save(existingTask);
    }
}