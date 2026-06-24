package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.model.Project;
import com.taskflow.taskflow.service.ProjectService;
import com.taskflow.taskflow.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*") // 🚀 THE FIX: Added this so your Dashboard can fetch projects!
public class ProjectController {
    // ... rest of your code stays exactly the same

    @Autowired
    private ProjectService projectService;

    @Autowired
    private PdfService pdfService;

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        return ResponseEntity.ok(projectService.createProject(project));
    }

    // 🚀 NEW: This answers the exact question React is asking!
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<?> getProjects(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(projectService.getProjectsByWorkspaceId(workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok("Project deleted successfully");
    }

    @GetMapping("/{projectId}/report")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long projectId) {
        byte[] pdfBytes = pdfService.generateProjectReport("Project #" + projectId, 10, 5);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report.pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}