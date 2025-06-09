
# InstantGram

A new age, minimalistic social media app to connect with your loved ones.


## Prerequisites (For using without Docker)
Make sure you have the following installed:
- Git (for clonning)
- Node.js (v16 or higher)
- npm 
- PostGres
- Redis
## Installation

```bash
  cd ./client
  npm i
  npm run dev
```

Open new Terminal and run the following commands

```bash
  cd ./server
  npm i
  npm run dev
```
Note: You Can also run the app with docker (I have added dockerfile and docker-compose.yml) but still you have to change many things in env. So I recommend to run without docker

## 📁 Project Structure
```
CruXQuest/
├── client/ # Frontend application
├── server/ # Backend application
└── README.md # This file
```
## Tech Stack Used

**Client:** React, TailwindCSS, Shadcn, Casl

**State-Management:** Zustand

**Caching Data (in cliend side):** Tanstack

**Server:** Node, Express, Cloudinary, Nodemailer

**Caching Data (in server):** Redis 

**Db:** PostgreSQL with Drizzle Orm
## Features Implimented

- User authentication with JWT (Sign Up, Login, Logout).
- Setup and update profile (name, unique username, profile picture, bio).
- Dark and Light theme support (can be changed in settings).
- Create, Read, and Delete posts with multiple images, description, and tags.
- Image upload with cloudinary
- Pagination (werever required)
- Accept, Reject and Send Friend Request to a user.
- Feature to like the post.
- Sorting posts by Top, New, and Controversial.
- Time-based filters (Last 24 hours, Last Month, Last Year) on Explore page.
- Tag-based filtering of posts.
- Nested comments section for each post.
- Fuzzy search to filter through all users, to find people and send friend requests.
- Rate Limiting to prevent scams.
- Request caching in the frontend for expensive api requests 
- Caching mechanism in server with Redis.
- Proper error handling with React Suspense Boundaries.
- Automated mails for acheiving milestones on post.
- Docker support (partially integrated).



## Screenshots

1. Auth page
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749450573/Screenshot_2025-06-09_115909_oal8r8.png)

2. Home page
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749450690/Screenshot_2025-06-09_120111_jw3cse.png)

3. Profile Page with your posts section
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749450755/Screenshot_2025-06-09_120225_kc7m9e.png)

4. Profile Page with Friend Requests section
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749451015/Screenshot_2025-06-09_120346_maetrs.png)

5. Explore page

![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749451016/Screenshot_2025-06-09_120445_m48gd0.png)

6. Settings page
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749451016/Screenshot_2025-06-09_120539_mmkaln.png)

7. Post details page with nested comments
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749451018/Screenshot_2025-06-09_120509_ntbpdm.png)

8. New Post page
![App Screenshot](https://res.cloudinary.com/dae3h92th/image/upload/v1749451016/Screenshot_2025-06-09_120638_q9u1sf.png)






