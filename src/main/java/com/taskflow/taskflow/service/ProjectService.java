package com.taskflow.taskflow.service;

import com.taskflow.taskflow.model.Project;
import com.taskflow.taskflow.model.Workspace;
import com.taskflow.taskflow.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Project createProject(Project project) {
        // If the project doesn't have a workspace, give it a default one so MySQL
        // doesn't crash!
        if (project.getWorkspace() == null) {
            Workspace defaultWorkspace = new Workspace();
            defaultWorkspace.setId(1L); // Force it into Workspace #1
            project.setWorkspace(defaultWorkspace);
        }
        return projectRepository.save(project);
    }

    public List<Project> getProjectsByWorkspaceId(Long workspaceId) {
        return projectRepository.findByWorkspaceId(workspaceId);
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    // 🚀 NEW: This asks the database for ALL projects
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
}