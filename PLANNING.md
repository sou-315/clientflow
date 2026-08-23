# CRM Project — Planning Document

## Overview
A CRM web application built as a portfolio project demonstrating React,
PHP MVC, MySQL, REST APIs, authentication, and authorization.

## Tech Stack
- Frontend: React, Vite, JavaScript, CSS, React Router
- Backend: PHP (custom MVC), REST API, PDO
- Database: MySQL

## Roadmap
22 phases (0–21), ~110 tasks. Full breakdown tracked task-by-task in
development. Key milestones:
0. Planning
1. Project Setup
2. Database Design & Setup
3. PHP MVC Foundation
4. Authentication (Backend)
5. Authentication (Frontend)
6. Authorization & Middleware
7. React App Foundation
8–9. Leads (Backend/Frontend)
10–11. Customers (Backend/Frontend)
12. Companies
13. Deals
14. Activities
15. Tasks
16. Dashboard
17. Polish & Advanced Features
18. Testing
19. Deployment
20. GitHub Setup
21. README & Documentation

## Core Entities
- users (Admin, Manager, Employee roles)
- companies
- customers (optionally linked to a company)
- leads (converts to a customer via converted_customer_id, original lead kept as history)
- deals (belongs to a customer)
- activities (optional lead_id / customer_id / deal_id — exactly one or none)
- tasks (optional lead_id / customer_id / deal_id — exactly one or none, or standalone)

## API Design
- REST conventions, resource-based URLs
- Filtering via query params (e.g. ?status=&search=)
- Lead conversion is a dedicated action endpoint: POST /api/leads/{id}/convert
- JWT-based auth, token stored client-side

## Folder Structure
See backend/ and frontend/ trees (established Phase 0, Task 4).

## Status
Phase 0 complete as of [today's date]. Starting Phase 1 — Project Setup next.