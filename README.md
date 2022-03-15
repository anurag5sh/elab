# elab
Server running on port 9292

# Folders
- middleware - contains some middleware functions which will be used to check each request.
- models - contains models of the database elements
- config - contains some important variable which will be used in the program
- public - this folder contains all the files that will be visible and accessible by the user.
- routes - contains the various route handlers for the project

 /app.js - the actual file which will run the server
 
 /views/ - all pug files 
 
 /public/ace-builds - do not touch this folder, editor files

 /public/adminLTE - admin panel files

# Modules
- express - create a RESTful api
- config - storing configuration values
- mongoose - manages the mongoDB
- session - creates a session for a logged in user
- moment - used to handle the date and time easily
- lodash - enables to pick some attributes from objects more easily
- connect-mongo - connects the mongo db with the session
- joi - data validation
- bcryptjs - used for hashing passwords
-request-promise - used to make http request to a given url

# Routes
- auth.js - handles the login and logout routes (also dashboard,editor temporarily)
- contest.js - handles the contest page
- practise.js - handles the practice page and the questions of practice page. Also adding of new questions for practice
- register.js - handles the register route for students and teachers
- admin.js - handles admin route
- api.js - handles the judge0 api 

# Models
- practice.js - the db structure of questions belonging to practice section.
- student.js - db structure of student account
- teacher.js - db structure of teacher account

# Middleware
- auth.js - checks if the user is logged in, otherwise throw error
- admin.js - checks if admin


# Admin
- Add/Delete accounts
- modify database
- Add accounts through csv
- Monitor student activity
- Generate report

# Teacher
- Create contest
- Create questions
- Practice
- Manage Contest 
- Create/Manage Assignment

# Student
- Making scrollable to display output after submit
- profile page
- result page
