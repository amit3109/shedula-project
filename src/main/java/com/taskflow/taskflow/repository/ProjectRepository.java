package com.taskflow.taskflow.repository;

import com.taskflow.taskflow.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // Make sure to import this!

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // 🛑 Add this exact line:
    List<Project> findByWorkspaceId(Long workspaceId);

}