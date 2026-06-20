package com.taskflow.taskflow.service;

import com.taskflow.taskflow.model.Workspace;
import com.taskflow.taskflow.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WorkspaceService {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    public Workspace createWorkspace(Workspace workspace) {
        return workspaceRepository.save(workspace);
    }

    public List<Workspace> getWorkspacesByUserId(Long userId) {
        return workspaceRepository.findByUserId(userId);
    }
}