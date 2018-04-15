import pickBy from 'lodash/pickBy'
import { sortInterval } from './sort_utils'
import { colorChooser } from './colors'

const DAYS_IN_WEEK = ['M', 'T', 'W', 'R', 'F']

const parseTime = (time, suffix) => {
  let schedule = time.split(':')
  var hour = parseInt(schedule[0], 10)
  var minute = parseInt(schedule[1], 10)
  if (hour >= 10) {
    suffix = 'am'
  }
  if (suffix === 'pm' && hour !== 12) {
    hour += 4
  }
  else {
    hour -= 8
  }
  return minute + 60 * hour
}

export const parseSchedule = (courses, onFailCallback) => {
  var results = [[], [], [], [], []]
  Object.keys(courses).forEach(course => {
    var blocks = courses[course].time.split('\n')
    blocks.forEach(block => {
      var schedule = block.split(' ')
      if (schedule.length < 2) {
        if (onFailCallback) {
          onFailCallback()
        }
        return
      }
      var days = schedule[0].split('')
      var time = schedule[1].slice(0, -2).split('-')
      var suffix = schedule[1].slice(-2)
      var start = parseTime(time[0], suffix)
      var end = parseTime(time[1], suffix)
      var name = courses[course].department + ' ' + courses[course].number
      var color = courses[course].color
      var crn = courses[course].crn
      time = time.join(' - ')
      days.forEach(day => {
        var index = DAYS_IN_WEEK.indexOf(day)
        if (index === -1) {
          return
        }
        results[index].push({
          start,
          end,
          name,
          time,
          color,
          crn
        })
      })
    })
  })
  return results
}

const findOverlapAmount = schedule => {
  var total = 0
  schedule.forEach(day => {
    var daySchedule = day.map(block => [block.start, block.end])
    daySchedule.sort(sortInterval)
    for (var i = 1; i < daySchedule.length; i++) {
      for (var j = i - 1; j >= 0 && daySchedule[j][1] >= daySchedule[i][0]; j--) {
        total += daySchedule[j][1] - daySchedule[i][0]
      }
    }
  })
  return total
}

function cartesian() {
  var r = [], arg = arguments, max = arg.length-1;
  function helper(arr, i) {
    for (var j=0, l=arg[i].length; j<l; j++) {
      var a = arr.slice(0); // clone arr
      a.push(arg[i][j]);
      if (i===max)
        r.push(a);
      else
        helper(a, i+1);
    }
  }
  if (arg.length) {
    helper([], 0);
  }
  return r;
}

export const findOptimizeSchedule = (courses, selected, colorOption) => {
  var initial = parseSchedule(selected, null)
  courses = pickBy(courses, (course, courseId) => course[0].number.length === 3)
  var options = cartesian(...Object.values(courses))
  var minOverlap = -1
  var solution = []
  var overlapCount = 0
  options.forEach(option => {
    var linkedCourses = []
    option.forEach(course => {
      if (course.linked.length) {
        linkedCourses.push(...course.linked)
      }
    })
    var linkedOptions = linkedCourses.length ? cartesian(...linkedCourses) : [null]
    linkedOptions.forEach(linkedOption => {
      var currOption = linkedOption ? option.concat(linkedOption) : option.concat([])
      var optionSchedule = parseSchedule(currOption)
      optionSchedule = optionSchedule.map((day, index) => day.concat(initial[index]))
      var currOverlap = findOverlapAmount(optionSchedule)
      if (minOverlap < 0 || minOverlap > currOverlap) {
        minOverlap = currOverlap
        solution = currOption
        overlapCount = 0
      }
      else if (minOverlap === currOverlap) {
        overlapCount += 1
        var randomNum = Math.round(Math.random() * overlapCount)
        if (randomNum === 1) {
          solution = currOption
        }
      }
    })
  })
  var results = {}
  solution.forEach(course => {
    var courseId = course.department + ' ' + course.number
    results[courseId] = {
      department: course.department,
      number: course.number,
      section: course.section,
      title: course.title,
      time: course.time,
      color: colorChooser(results, colorOption),
      crn: course.crn
    }
  })
  var linked = {}
  Object.keys(results).forEach(course => {
    if (courses[course]) {
      courses[course].forEach(section => {
        if (section.section === results[course].section) {
          section.selected = true
          section.linked.forEach(linkedCourse => {
            linkedCourse.forEach(linkedSection => {
              var linkedCourseId = linkedSection.department + ' ' + linkedSection.number
              if (results[linkedCourseId]) {
                if (results[linkedCourseId].section === linkedSection.section) {
                  linkedSection.selected = true
                }
                if (linked[linkedCourseId]) {
                  linked[linkedCourseId].push(linkedSection)
                }
                else {
                  linked[linkedCourseId] = [linkedSection]
                }
              }
            })
          })
        }
      })
    }
  })
  return { courses: Object.assign({}, courses, linked), selected: results }
}
