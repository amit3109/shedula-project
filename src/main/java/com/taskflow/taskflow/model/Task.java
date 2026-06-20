package com.taskflow.taskflow.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "tasks")
@Data
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // 🚀 THE NEW FIELDS (Lombok automatically creates the Getters/Setters!)
    private String description;
    private String dueDate;
    private String priority;

    private String assignedTo;
    // This forces every new task to start in the "TODO" column
    @Column(nullable = false)
    private String status = "TODO";

    // The One-Way Door! Links this task to a specific project.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}