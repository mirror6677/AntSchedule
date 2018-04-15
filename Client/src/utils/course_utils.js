import { API_ROOT } from './variables'

export const loadMajorCourses = (courses, callback) => {
  // need an array of courses in the form "CSCI 203"
  var results = {}
  var count = 0
  courses.forEach(course => {
    fetch(`${API_ROOT}/courseDetail/${course.split(' ')[0]}/${course.split(' ')[1]}`).then(res => res.json()).then(data => {
      data.forEach(el => {
        var linkedCourses = []
        if (el.Linked && el.Linked.length) {
          el.Linked.forEach(temp => {
            var linkedCourse = []
            temp.forEach(t => {
              linkedCourse.push({
                crn: t.CRN,
                department: t.Department,
                number: t.CrseNum,
                section: t.Section,
                title: t.Title,
                time: t.Time,
                ccc: t.CCCReq,
                instructor: t.Instructor,
                notes: t.Notes,
                room: t.Room,
                seats: t.Seats,
                desc: t.Desc,
                linked: [],
                selected: false
              })
            })
            linkedCourses.push(linkedCourse)
          })
        }
        var c = {
          crn: el.CRN,
          department: el.Department,
          number: el.CrseNum,
          section: el.Section,
          title: el.Title,
          time: el.Time,
          ccc: el.CCCReq,
          instructor: el.Instructor,
          notes: el.Notes,
          room: el.Room,
          seats: el.Seats,
          desc: el.Desc,
          linked: linkedCourses,
          selected: false
        }
        if (results.hasOwnProperty(course)) {
          results[course].push(c)
        }
        else {
          results[course] = [c]
        }
      })
      count++
      if (count === courses.length) {
        callback(results)
      }
    })
  })
}

export const selectCourse = (course, callback) => {
  // need one course object with department, number, and title
  var result = []
  fetch(`${API_ROOT}/courseDetail/${course.department}/${course.number}/${course.title}`).then(res => res.json()).then(data => {
    data.forEach(el => {
      var linkedCourses = []
      if (el.Linked && el.Linked.length) {
        el.Linked.forEach(temp => {
          var linkedCourse = []
          temp.forEach(t => {
            linkedCourse.push({
              crn: t.CRN,
              department: t.Department,
              number: t.CrseNum,
              section: t.Section,
              title: t.Title,
              time: t.Time,
              ccc: t.CCCReq,
              instructor: t.Instructor,
              notes: t.Notes,
              room: t.Room,
              seats: t.Seats,
              desc: t.Desc,
              linked: [],
              selected: false
            })
          })
          linkedCourses.push(linkedCourse)
        })
      }
      result.push({
        crn: el.CRN,
        department: course.department,
        number: course.number,
        section: el.Section,
        title: el.Title,
        time: el.Time,
        ccc: el.CCCReq,
        instructor: el.Instructor,
        notes: el.Notes,
        room: el.Room,
        seats: el.Seats,
        desc: el.Desc,
        linked: linkedCourses,
        selected: false
      })
    })
    callback(course, result)
  })
}

export const selectCourseAsync = async course => {
  // need one course object with department, number, and section
  var result = []
  var selectedTitle
  await fetch(`${API_ROOT}/courseDetail/${course.department}/${course.number}`).then(res => res.json()).then(data => {
    data.forEach(el => {
      var selected = false
      if (el.Section === course.section) {
        selectedTitle = el.Title
        selected = true
      }
      var linkedCourses = []
      if (el.Linked && el.Linked.length) {
        el.Linked.forEach(temp => {
          var linkedCourse = []
          temp.forEach(t => {
            linkedCourse.push({
              crn: t.CRN,
              department: t.Department,
              number: t.CrseNum,
              section: t.Section,
              title: t.Title,
              time: t.Time,
              ccc: t.CCCReq,
              instructor: t.Instructor,
              notes: t.Notes,
              room: t.Room,
              seats: t.Seats,
              desc: t.Desc,
              linked: [],
              selected: false
            })
          })
          linkedCourses.push(linkedCourse)
        })
      }
      result.push({
        crn: el.CRN,
        department: course.department,
        number: course.number,
        section: el.Section,
        title: el.Title,
        time: el.Time,
        ccc: el.CCCReq,
        instructor: el.Instructor,
        notes: el.Notes,
        room: el.Room,
        seats: el.Seats,
        desc: el.Desc,
        linked: linkedCourses,
        selected: selected
      })
    })
  })
  return result.filter(course => course.number.length !== 3 || course.title === selectedTitle)
}
