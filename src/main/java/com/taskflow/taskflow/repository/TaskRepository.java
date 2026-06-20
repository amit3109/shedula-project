package com.taskflow.taskflow.repository;

import com.taskflow.taskflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // Custom SQL command: "Hey MySQL, give me all tasks that belong to this
    // specific Project!"
    List<Task> findByProjectId(Long projectId);
}