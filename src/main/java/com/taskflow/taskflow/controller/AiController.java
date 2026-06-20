package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.dto.AiRequest;
import com.taskflow.taskflow.model.Project;
import com.taskflow.taskflow.model.Task;
import com.taskflow.taskflow.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    @Autowired
    private TaskRepository taskRepository;

    // Pulls the key securely from application.properties
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // ─── 1. ORIGINAL TASK GENERATOR ──────────────────────────────────────────
    @PostMapping("/generate/{projectId}")
    public ResponseEntity<?> generateTasks(@PathVariable Long projectId, @RequestBody AiRequest aiRequest) {
        try {
            System.out.println("🚨 THE WAITER HEARD: " + aiRequest.getPrompt());

            // 🚀 FIXED: Using the active 2.5-flash model
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                    + geminiApiKey;
            RestTemplate restTemplate = new RestTemplate();

            String customPrompt = "You are a project manager. Generate a list of exactly 5 technical tasks based on this project description: "
                    + aiRequest.getPrompt()
                    + ". Return ONLY the task titles, one per line. Do not include numbers, bullet points, or markdown.";

            Map<String, Object> textObj = Map.of("text", customPrompt);
            Map<String, Object> partsObj = Map.of("parts", List.of(textObj));
            Map<String, Object> contentsObj = Map.of("contents", List.of(partsObj));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(contentsObj, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(geminiUrl, entity, Map.class);

            List candidates = (List) response.getBody().get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            Map firstPart = (Map) parts.get(0);
            String aiOutput = (String) firstPart.get("text");

            String[] taskTitles = aiOutput.split("\\r?\\n");
            List<Task> savedTasks = new ArrayList<>();

            for (String title : taskTitles) {
                if (!title.trim().isEmpty()) {
                    Task task = new Task();
                    task.setTitle("✨ AI: " + title.replace("*", "").replace("-", "").trim());
                    task.setStatus("TODO");

                    Project linkedProject = new Project();
                    linkedProject.setId(projectId);
                    task.setProject(linkedProject);

                    savedTasks.add(taskRepository.save(task));
                }
            }
            return ResponseEntity.ok(savedTasks);

        } catch (HttpStatusCodeException e) {
            System.err.println("Google API Error: " + e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode()).body("Google AI Service Error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating tasks via AI: " + e.getMessage());
        }
    }

    // ─── 2. NEW PROJECT HEALTH ANALYZER ──────────────────────────────────────
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeProjectHealth(@RequestBody Map<String, String> payload) {
        try {
            String projectData = payload.get("projectData");

            System.out.println("🚨 ANALYZING BOARD HEALTH FOR: " + projectData.length() + " characters of data.");

            // 🚀 FIXED: Using the active 2.5-flash model
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                    + geminiApiKey;
            RestTemplate restTemplate = new RestTemplate();

            // Strict Prompt Engineering for the Health Report
            String customPrompt = "You are an elite agile project manager. Analyze the following project tasks and provide a concise, 2-paragraph health summary. "
                    +
                    "Point out any bottlenecks (like too many tasks 'IN_PROGRESS' or high priority tasks stuck in 'TODO') and suggest what the team should focus on next. "
                    +
                    "Do not list the tasks out again, just analyze the overall health. Use bolding for emphasis.\n\nTasks Data:\n"
                    + projectData;

            Map<String, Object> textObj = Map.of("text", customPrompt);
            Map<String, Object> partsObj = Map.of("parts", List.of(textObj));
            Map<String, Object> contentsObj = Map.of("contents", List.of(partsObj));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(contentsObj, headers);

            // Execute Request
            ResponseEntity<Map> response = restTemplate.postForEntity(geminiUrl, entity, Map.class);

            // Parse Response
            List candidates = (List) response.getBody().get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            Map firstPart = (Map) parts.get(0);
            String aiOutput = (String) firstPart.get("text");

            // Return cleanly wrapped inside a Map so React can read 'response.data.summary'
            Map<String, String> result = new HashMap<>();
            result.put("summary", aiOutput);
            return ResponseEntity.ok(result);

        } catch (HttpStatusCodeException e) {
            System.err.println("Google API Error: " + e.getResponseBodyAsString());
            Map<String, String> error = new HashMap<>();
            error.put("summary", "⚠️ Gemini API Error: " + e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("summary", "⚠️ Internal Server Error analyzing tasks: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}