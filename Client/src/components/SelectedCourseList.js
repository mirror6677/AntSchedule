import React, { Component } from 'react'
import { Collapse, Icon } from 'antd'
import styles from '../css/mainPage.css'
import { selectCourse, selectCourseAsync } from '../utils/course_utils'
import { parseSchedule, findOptimizeSchedule } from '../utils/schedule_utils'
import { colorChooser } from '../utils/colors'

const Panel = Collapse.Panel

class SelectedCourseList extends Component {
  state = {
    courses: {},
    selected: {}
  }

  restored = false

  componentDidMount() {
    if (this.props.loadFromUrl) {
      this.restored = true
      this.restoreUrlData(this.props.urlData)
    }
  }

  restoreUrlData = async urlData => {
    var courses = {}
    var selected = {}
    for (const course of urlData) {
      let courseId = course.department + ' ' + course.number
      if (courses.hasOwnProperty(courseId)) {
        return
      }
      const result = await selectCourseAsync(course, this.addCourseCompleted)
      result.forEach(section => {
        if (course.section === section.section) {
          selected[`${course.department} ${course.number}`] = {
            department: section.department,
            number: section.number,
            section: section.section,
            title: section.title,
            time: section.time,
            color: colorChooser(selected, true),
            crn: section.crn
          }
          section.selected = true
          courses[courseId] = result
        }
      })
    }
    this.setState({ courses, selected })
    this.props.parseScheduleCallback(parseSchedule(selected, this.props.parseScheduleFailed))
  }

  exportCourses = () => {
    var { selected } = this.state
    var results = []
    Object.keys(selected).forEach(course => {
      results.push({
        department: selected[course].department,
        number: selected[course].number,
        section: selected[course].section
      })
    })
    return results
  }

  autoSchedule = majorCourses => {
    var { courses, selected } = findOptimizeSchedule(this.state.courses, majorCourses, this.restored)
    this.props.parseScheduleCallback(parseSchedule(selected, this.props.parseScheduleFailed))
    return { courses, selected }
  }

  onAutoGenerateComplete = selectedState => {
    let { courses, selected } = selectedState
    this.setState({
      courses,
      selected
    })
  }

  addCourse = course => {
    let courseId = course.department + ' ' + course.number
    if (this.state.courses.hasOwnProperty(courseId)) {
      this.deleteCourse(null, courseId)
    }
    selectCourse(course, this.addCourseCompleted)
  }

  addCourseCompleted = (course, result) => {
    let courseId = course.department + ' ' + course.number
    var courses = Object.assign({}, this.state.courses)
    courses[courseId] = result
    this.setState({ courses })
  }

  deleteCourse = (event, course) => {
    event && event.stopPropagation()
    var courses = Object.assign({}, this.state.courses)
    var selected = Object.assign({}, this.state.selected)
    courses[course].forEach(section => {
      if (section.selected) {
        section.linked.forEach(linkedCourse => {
          linkedCourse.forEach(linkedSection => {
            delete courses[`${linkedSection.department} ${linkedSection.number}`]
            delete selected[`${linkedSection.department} ${linkedSection.number}`]
          })
        })
      }
    })
    delete courses[course]
    delete selected[course]
    this.setState({ courses, selected })
    this.props.parseScheduleCallback(parseSchedule(selected, null))
  }

  selectUnselectCourse = (event, course, section) => {
    event.stopPropagation()
    var courses = Object.assign({}, this.state.courses)
    var selected = Object.assign({}, this.state.selected)
    if (courses[course][section].selected) {
      // unselect course
      courses[course][section].selected = false
      courses[course][section].linked.forEach(linkedCourse => {
        linkedCourse.forEach(linkedSection => {
          delete courses[`${linkedSection.department} ${linkedSection.number}`]
          delete selected[`${linkedSection.department} ${linkedSection.number}`]
        })
      })
      delete selected[course]
    }
    else {
      //select course
      courses[course].forEach(sec => sec.selected = false)
      // set selected to true
      courses[course][section].selected = true
      // add section to selected
      delete selected[`${courses[course][section].department} ${courses[course][section].number}`]
      selected[`${courses[course][section].department} ${courses[course][section].number}`] = {
        department: courses[course][section].department,
        number: courses[course][section].number,
        section: courses[course][section].section,
        title: courses[course][section].title,
        time: courses[course][section].time,
        color: colorChooser(selected, false),
        crn: courses[course][section].crn
      }
      courses[course][section].linked.forEach(c => {
        courses[c[0].department + ' ' + c[0].number] = c
      })
    }
    this.setState({ courses, selected })
    this.props.parseScheduleCallback(parseSchedule(selected, this.props.parseScheduleFailed))
  }

  onCourseAdded = (course, result) => {
    let courseId = course.department + ' ' + course.number
    this.setState({
      courses: {...this.state.courses, [courseId]: result}
    })
  }

  headerElement = (text, color) => (
    <div className={styles.collapseHeader}>
      <div>
        <span className={styles.indicator} style={{backgroundColor: color}}></span>
        {text}
      </div>
      <span>
        <Icon 
          type="close"
          className={styles.iconButton}
          onClick={e => this.deleteCourse(e, text.split(' - ')[0])}
          />
      </span>
    </div>
  )

  subheaderElement = (text, course, section, color) => (
    <div className={styles.collapseHeader}>
      <div>
        <span className={styles.indicator} style={{backgroundColor: color}}></span>
        {text}
      </div>
      <span>
        <Icon 
          type={this.state.courses[course][section].selected ? 'minus-circle-o' : 'plus-circle-o'} 
          className={styles.iconButton} 
          onClick={e => this.selectUnselectCourse(e, course, section)} 
          />
      </span>
    </div>
  )

  render() {
    const { courses, selected } = this.state
    console.log(courses)
    return (
      Object.keys(courses).length ? <div className={styles.section}>
        <div className={styles.collapseHeader}>
          <p>Selected Courses</p>
        </div>
        <Collapse accordion>
          {Object.keys(courses).map(course => (
            <Panel header={this.headerElement(course + ' - ' + courses[course][0].title, selected[course] ? selected[course].color : 'gray')} key={course}>
              <Collapse accordion>
                {courses[course].map((section, index) => (
                  <Panel header={this.subheaderElement(section.department + ' ' + section.number + ' ' + section.section, course, index, selected[course] && selected[course].section === section.section ? selected[course].color : 'gray' )} key={section.section}>
                    <p>{section.time.replace(/\n/g, ', ')}</p>
                    <p>
                      <b>Title:</b>{' ' + section.title} <br/>
                      <b>Instructor:</b>{' ' + section.instructor} <br/>
                      <b>Room:</b>{section.room.length ? ' ' + section.room : ' none'} <br/>
                      <b>Seats:</b>{section.seats ? ' ' + section.seats : ' n/a'} <br/>
                      <b>CCC Requirements:</b>{section.ccc.length ? ' ' + section.ccc.reduce((a, c) => a + ', ' + c) : ' none'} <br/>
                      <b>Description:</b>{section.desc ? ' ' + section.desc : 'none'} <br/>
                      <b>Notes:</b>{section.notes ? ' ' + section.notes : ' none'} <br/>
                    </p>
                  </Panel>
                ))}
              </Collapse>
            </Panel>
          ))}
        </Collapse>
      </div> : <div />
    )
  }
}

export default SelectedCourseList
