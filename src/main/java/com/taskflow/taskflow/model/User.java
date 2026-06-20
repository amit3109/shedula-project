package com.taskflow.taskflow.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // 🚀 NEW: Notification Preferences
    private boolean emailOnTaskAssigned = true;
    private boolean emailOnProjectComplete = false;
    private boolean weeklyDigest = true;

    // 🚀 THE FIX: Added the role column so your database can save "Admin" or
    // "Project Manager"!
    @Column(nullable = false)
    private String role = "Team Member"; // Default value just in case

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}