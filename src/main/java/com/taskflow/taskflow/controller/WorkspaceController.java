package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.model.Workspace;
import com.taskflow.taskflow.service.WorkspaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<Workspace> createWorkspace(@RequestBody Workspace workspace) {
        return ResponseEntity.ok(workspaceService.createWorkspace(workspace));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWorkspaces(@PathVariable Long userId) {
        return ResponseEntity.ok(workspaceService.getWorkspacesByUserId(userId));
    }
}