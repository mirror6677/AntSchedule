# AntSchedule
Course scheduling web application for Bucknell University

## Key Features
* Single page web application built using [React](https://reactjs.org) and [Ant Design](https://ant.design)
* Fast course lookup by department, course number, title, and CCC requirement
* Engineering major requirements encoded to prepopulate courses based on major and class year
* Algorithm to generate optimal course schedule with minimum overlaping time
* [API endpoint](http://antschedule-api.herokuapp.com) to support realtime course search autocomplete and course data retrieval

## Demo
![](https://github.com/mirror6677/AntSchedule/blob/master/demo.gif)

## Project Structure
This project has two main components:
* Back-end script written in [GoLang](https://golang.org). It crawls Bucknell's bannerweb pages concurrently to get course data, then serve the data on the API endpoints. /searchCourses/{query} provides a list of courses matching the query and their basic info (deparment, course number, title); /courseDetail/{department}/{crseNum}/{title} provides the detail info of the course specified (professor, meeting time, seats, description, etc).
* Front-end application written with [React](https://reactjs.org). It provides a clean interface for students to construct or auto-generate schedules from major requirements and courses searching. It also provides a variety of export methods (schedule as pdf, CRNs as pdf, reusable URL) to support different user purposes.

## Contribute
This project is currently limited to a course scheduling application. I intend to incorporate other related features such as using [RateMyProfessor](www.ratemyprofessor.com) and/or a built-in course/professor rating system to make discovering courses more easily for the students. You can also create issues if you have other ideas, as long as they are related to the major purpose of this application.

## License
Licensed under the GNU General Public License v3.0
