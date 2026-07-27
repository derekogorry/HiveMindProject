# 🐝 HiveMind

HiveMind is a collaborative Learning Management System (LMS) designed to improve the assignment submission process through structured peer review. Instead of submitting assignments directly to an instructor, students can first upload their work to HiveMind, receive constructive feedback from classmates, make revisions, and schedule their final submission before the official deadline.

The goal of HiveMind is to encourage academic collaboration, improve assignment quality, and create a course-based learning community while maintaining academic integrity.

---

## Project Overview

HiveMind provides students with a dedicated space to:

- Upload assignments for peer review
- Receive constructive feedback from classmates
- Revise assignments before submission
- Schedule automatic submission deadlines
- Connect with classmates studying similar subjects
- Appeal moderation decisions when necessary

Unlike traditional Learning Management Systems, HiveMind emphasizes collaboration before submission rather than evaluation afterward.

---

## Features

### Student (Post Originator)

- Upload assignments for peer review
- Schedule assignment publication and submission deadlines
- Read and respond to peer feedback
- Manage assignment revisions
- View reviewer comments
- Send appeals if comments are removed
- Connect with classmates through friend requests

### Student (Peer Reviewer)

- Browse assignments available for review
- Leave constructive comments and suggestions
- Link helpful resources or references
- Follow or send friend requests to other students

### Administrator

- Moderate peer review comments
- Remove inappropriate or plagiaristic guidance
- Review and respond to user appeals
- Maintain platform integrity

---

## Pages

- Login / Sign Up
- Assignment Upload
- Assignment Review
- User Profile
- Friends & Connections

Future pages may include:

- Dashboard
- Notifications
- Admin Moderation Panel
- Appeals Center

---

## Database Design

### Users
- user_id
- name
- email
- password
- role

### Assignments
- assignment_id
- user_id
- title
- course_name
- review_deadline
- submission_deadline

### Friend Requests
- request_id
- sender_id
- receiver_id
- status

### Appeals
- appeal_id
- user_id
- comment_id
- appeal_text
- admin_response
- status

---

## Relationship Overview

- One user can upload many assignments.
- One assignment can receive many peer reviews.
- Students can connect through friend requests.
- Appeals are linked to moderated comments.

---

## Team

| Member | Responsibilities |
|---------|------------------|
| Derek Ogorry | UX Design, Graphic Design |
| Japroz Saini | UI Design |
| Alex | Program Testing |

---

## Project Risks

### Comment Moderation

Moderating comments and handling appeals could become increasingly complex as platform activity grows.

**Mitigation**

- Develop the core commenting system first.
- Add moderation and appeals afterward.
- Automatically expire unresolved appeals after a set period.

---

### File Uploads

Supporting multiple file types and managing storage may introduce technical challenges.

**Mitigation**

- Begin with text-based and PDF submissions.
- Thoroughly test upload functionality before expanding supported formats.

---

## Unique Feature

HiveMind allows students to schedule assignments for future submission while gathering peer feedback during a dedicated review window. This workflow combines collaborative learning with automated submission scheduling and course-based networking, giving students an opportunity to improve their work before it is officially submitted.

---

## Future Improvements

- Course recommendation system
- Reviewer reputation scores
- AI-assisted grammar suggestions
- Rubric-based reviews
- Anonymous review mode
- Instructor dashboards
- Review analytics
- Email notifications

---

## License

This project was developed as part of the CSC 4370 Software Engineering course at Georgia State University.
