package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.model.Task;
import com.taskflow.taskflow.service.TaskService;
import com.taskflow.taskflow.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/project/{projectId}")
    public ResponseEntity<Task> createTask(@PathVariable Long projectId, @RequestBody Task task) {
        Task createdTask = taskService.createTask(projectId, task);

        // 📢 Broadcast that a new task was created
        messagingTemplate.convertAndSend("/topic/project/" + projectId, createdTask);

        return ResponseEntity.ok(createdTask);
    }

    // 🚀 NEW: The endpoint the Calendar and Inbox use to get ALL tasks
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<Task> updateTaskStatus(@PathVariable Long taskId,
            @RequestBody Map<String, String> statusUpdate) {
        Task updatedTask = taskService.updateTaskStatus(taskId, statusUpdate.get("status"));

        // 📢 Broadcast that the task moved columns
        if (updatedTask.getProject() != null) {
            messagingTemplate.convertAndSend("/topic/project/" + updatedTask.getProject().getId(), updatedTask);
        }

        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable Long taskId) {
        // Find the task first so we know which project channel to broadcast to
        Task task = taskRepository.findById(taskId).orElse(null);
        Long projectId = (task != null && task.getProject() != null) ? task.getProject().getId() : null;

        taskService.deleteTask(taskId);

        // 📢 Broadcast the ID of the deleted task so React removes it instantly
        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId + "/delete", taskId);
        }

        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTaskDetails(@PathVariable Long taskId, @RequestBody Task updatedDetails) {
        try {
            Task existingTask = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found!"));

            existingTask.setDescription(updatedDetails.getDescription());
            existingTask.setDueDate(updatedDetails.getDueDate());
            existingTask.setPriority(updatedDetails.getPriority());
            existingTask.setAssignedTo(updatedDetails.getAssignedTo());

            Task savedTask = taskRepository.save(existingTask);

            if (savedTask.getProject() != null) {
                messagingTemplate.convertAndSend("/topic/project/" + savedTask.getProject().getId(), savedTask);
            }

            return ResponseEntity.ok(savedTask);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating task: " + e.getMessage());
        }
    }
}