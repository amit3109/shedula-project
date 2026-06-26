# Shedula - AI-Powered Project Management Board 🚀

A full-stack, real-time Kanban board application designed to streamline team collaboration, automate task generation using Google Gemini AI, and provide deep analytics into project health. 

<img width="1897" height="851" alt="Shedula Hero Image" src="https://github.com/user-attachments/assets/b0501bf9-5724-44ae-980f-db8049f6f369" />

## ✨ Key Features
* **Real-Time Collaboration:** Integrated STOMP/SockJS WebSockets to instantly update tasks across all connected users without page refreshes.
* **AI Task Generation:** Connected the Google Gemini AI API to automatically break down project prompts into actionable sub-tasks.
* **Interactive Kanban Board:** Built a responsive drag-and-drop interface using `@hello-pangea/dnd` for seamless task management.
* **Smart Dashboards & Analytics:** Utilized `recharts` to build dynamic charts tracking project completion rates, overdue tasks, and user workloads.
* **Cloud Deployed:** Fully deployed architecture using Render (Backend/Frontend) and Aiven (MySQL Database).

## 📸 App Showcase

<img width="1895" height="858" alt="Kanban Board" src="https://github.com/user-attachments/assets/6b9fba37-c482-4f9b-908a-0f3dcc82fd81" />
<br/>
<img width="1913" height="871" alt="Analytics Dashboard" src="https://github.com/user-attachments/assets/9deca87c-f6ef-4e8a-88a1-caa96ffaa5a2" />
<br/>
<img width="1917" height="845" alt="Inbox View" src="https://github.com/user-attachments/assets/4eb7af4e-3a3e-40b2-8ff6-01a205e01d90" />

## 🛠️ Tech Stack
**Frontend:**
* React.js (React Router, Hooks)
* HTML5, CSS3 (Custom Glassmorphism UI)
* Recharts (Data Visualization)
* Axios (API Client)

**Backend:**
* Java 17 & Spring Boot 3
* Spring Data JPA / Hibernate
* RESTful API Architecture
* WebSockets (STOMP messaging)

**Database & APIs:**
* MySQL (Hosted on Aiven Cloud)
* Google Gemini AI API

## 🧠 Challenges & Learnings
Building this application from scratch was a massive learning experience. Here are a few technical hurdles I overcame:
1. **The N+1 Query Problem:** Initially, the dashboard suffered from severe loading delays due to looping API requests. I optimized the frontend data fetching engine using `Promise.all()` to grab all projects and tasks in exactly two lightning-fast requests, matching the relational data locally.
2. **Database Hibernation:** Overcame free-tier cloud hosting limitations (Render/Aiven putting the server to sleep) by configuring custom HTTP polling monitors via UptimeRobot to ensure instant "cold starts."
3. **CORS & WebSocket Security:** Successfully configured Cross-Origin Resource Sharing rules in Spring Boot to allow secure WebSocket handshakes between the separate frontend and backend cloud servers.

## 🚀 Getting Started (Local Setup)

Want to run Shedula on your local machine? Follow these steps:

### Prerequisites
* Java 17+
* Node.js & npm
* MySQL Server running locally

### 1. Backend Setup
```bash
git clone [https://github.com/amti3109/shedula-backend.git](https://github.com/amti3109/shedula-backend.git)
cd shedula-backend
