package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.model.Project;
import com.taskflow.taskflow.service.ProjectService;
import com.taskflow.taskflow.service.PdfService; // 🚀 NEW: Imported the PdfService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // 🚀 NEW: Autowired the PdfService so Java knows what it is!
    @Autowired
    private PdfService pdfService;

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        return ResponseEntity.ok(projectService.createProject(project));
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
        // Now this line will work perfectly!
        byte[] pdfBytes = pdfService.generateProjectReport("Project #" + projectId, 10, 5); // Added the total and done
                                                                                            // numbers from earlier!

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report.pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}