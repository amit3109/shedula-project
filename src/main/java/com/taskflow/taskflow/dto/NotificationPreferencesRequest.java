package com.taskflow.taskflow.dto;

import lombok.Data;

@Data
public class NotificationPreferencesRequest {
    private boolean emailOnTaskAssigned;
    private boolean emailOnProjectComplete;
    private boolean weeklyDigest;
}