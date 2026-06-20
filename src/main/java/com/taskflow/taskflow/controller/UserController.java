package com.taskflow.taskflow.controller;

import com.taskflow.taskflow.model.User;
import com.taskflow.taskflow.dto.LoginRequest;
import com.taskflow.taskflow.service.UserService;
import com.taskflow.taskflow.security.JwtTokenProvider;
import com.taskflow.taskflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.taskflow.taskflow.dto.ChangePasswordRequest;
import com.taskflow.taskflow.dto.NotificationPreferencesRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userService.findByEmail(loginRequest.getEmail());

        if (userOpt.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            String token = tokenProvider.generateToken(loginRequest.getEmail());

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("email", loginRequest.getEmail());
            response.put("name", userOpt.get().getName());

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body("Invalid email or password!");
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    // 🚀 NEW: Handles the "Invite Member" button from React
    @PostMapping
    public ResponseEntity<?> inviteUser(@RequestBody User user) {
        try {
            // We can re-use your existing register logic for invites!
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to invite user: " + e.getMessage());
        }
    }

    // 🚀 NEW: Handles the "Remove" button from React
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete user");
        }
    }

    // 🚀 NEW: Handles the "Update Password" button from React Settings
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {

        // 1. Grab the email of the user who is currently logged in (from their JWT
        // token)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        Optional<User> userOpt = userService.findByEmail(currentEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // 2. Check if the current password they typed matches the one in the database
            if (passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {

                // 3. Hash the brand new password and save it
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                userRepository.save(user);

                return ResponseEntity.ok().body("Password updated successfully!");
            } else {
                return ResponseEntity.badRequest().body("Incorrect current password.");
            }
        }
        return ResponseEntity.status(404).body("User not found.");
    }

    // 🚀 NEW: Handles saving Notification Toggles from React Settings
    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody NotificationPreferencesRequest request) {

        // 1. Find out who is currently logged in
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        Optional<User> userOpt = userService.findByEmail(currentEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // 2. Update their database record with the new toggles
            user.setEmailOnTaskAssigned(request.isEmailOnTaskAssigned());
            user.setEmailOnProjectComplete(request.isEmailOnProjectComplete());
            user.setWeeklyDigest(request.isWeeklyDigest());

            // 3. Save to MySQL
            userRepository.save(user);

            return ResponseEntity.ok().body("Preferences updated successfully!");
        }
        return ResponseEntity.status(404).body("User not found.");
    }
}