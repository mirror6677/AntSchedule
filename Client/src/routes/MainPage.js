import React, { Component } from 'react'
import { connect } from 'dva'
import { Row, Col, AutoComplete, Button, Tooltip, Spin, Icon, message } from 'antd'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import copy from 'copy-to-clipboard'
import _ from 'lodash'
import styles from '../css/mainPage.css'
import { API_ROOT } from '../utils/variables'
import { sortCourses } from '../utils/sort_utils'
import { parseSchedule } from '../utils/schedule_utils'
import MajorCourseList from '../components/MajorCourseList'
import SelectedCourseList from '../components/SelectedCourseList'
import Week from '../components/Schedule/Week'

const Option = AutoComplete.Option
const ButtonGroup = Button.Group

class MainPage extends Component {
  state = {
    query: "",
    loadFromUrl: false,
    urlData: null,
    majorSelected: false,
    major: null,
    classYear: null,
    courses: [],
    selectedMajorCourses: [[], [], [], [], []],
    selectedOtherCourses: [[], [], [], [], []],
    selectedCourses: [[], [], [], [], []],
    generating: false
  }

  componentWillMount() {
    if (this.props.location.search.length) {
      this.parseQueryString(this.props.location.search + this.props.location.hash)
    }
    else if ( this.props.match.params !== {}) {
      let { major, classYear } =  this.props.match.params
      this.setState({
        majorSelected: true,
        major,
        classYear
      })
    }
  }

  parseQueryString = query => {
    var queryObj = _.chain(query).replace('?', '').split('&').map(_.partial(_.split, _, '=', 2)).fromPairs().value()
    var urlData = JSON.parse(decodeURI(queryObj.data))
    this.setState({
      loadFromUrl: true,
      urlData: urlData
    })
  }

  handleSearch = async query => {
    this.setState({
      query
    })
    var results = {}
    var courses = []

    await fetch(`${API_ROOT}/searchCourses/${query}`).then(res => res.json()).then(data => {
      if (this.state.query !== query) {
        return
      }
      data.forEach(el => {
        var department = el.Department
        var number = el.CrseNum
        if (number.length > 3) {
          return
        }
        var course = department + ' ' + number
        if (results.hasOwnProperty(course) && results[course] === el.Title) {
          return
        }
        results[course] = el.Title
        courses.push({
          department: department,
          number: number,
          title: el.Title
        })
      })
      courses.sort(sortCourses)
      this.setState({
        courses: courses
      })
    })
  }

  handleSelect = value => {
    let course = this.state.courses[value]
    this.selectedChild.addCourse(course)
  }

  onParseMajorScheduleComplete = results => {
    var total = []
    const { selectedOtherCourses } = this.state
    results.forEach((day, index) => {
      total.push(day.concat(selectedOtherCourses[index]))
    })
    this.setState({
      selectedMajorCourses: results,
      selectedCourses: total
    })
  }

  onParseOtherScheduleComplete = results => {
    var total = []
    const { selectedMajorCourses } = this.state
    results.forEach((day, index) => {
      total.push(selectedMajorCourses[index].concat(day))
    })
    this.setState({
      selectedOtherCourses: results,
      selectedCourses: total
    })
  }

  onParseAllScheduleComplete = (majorResults, otherResults, majorState, selectedState) => {
    var total = []
    majorResults.forEach((day, index) => {
      total.push(day.concat(otherResults[index]))
    })
    this.majorChild && this.majorChild.onAutoGenerateComplete(majorState)
    this.selectedChild.onAutoGenerateComplete(selectedState)
    this.setState({
      selectedMajorCourses: majorResults,
      selectedOtherCourses: otherResults,
      selectedCourses: total
    })
  }

  onParseScheduleFailed = () => {
    message.warning('Course time not yet available')
  }

  printSchedule = () => {
    const input = document.getElementById('printSchedule')
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'letter')
      var width = pdf.internal.pageSize.width;    
      var height = pdf.internal.pageSize.height;
      pdf.addImage(imgData, 'JPEG', 10, 10, width-20, height-80)
      pdf.save("schedule.pdf")
    })
  }

  exportCRNs = () => {
    var results = {}
    this.state.selectedCourses.forEach(day => {
      day.forEach(course => {
        if (!results[course.crn]) {
          results[course.crn] = course.name
        }
      })
    })
    var doc = new jsPDF();
    var position = 20
    Object.keys(results).forEach(crn => {
      doc.text(20, position, `${crn} : ${results[crn]}`)
      position += 10
    })
    doc.save("CRNs.pdf")
  }

  generateUrl = () => {
    var data = this.majorChild ? this.majorChild.exportCourses().concat(this.selectedChild.exportCourses()) : this.selectedChild.exportCourses()
    var root_url = window.location.origin + '/'
    if (root_url.split(':', 1)[0] === 'https') {
      root_url += 'fullstack/project2/release/v2.0/index.html'
    }
    var url = `${root_url}#/restore?data=${encodeURI(JSON.stringify(data))}`
    copy(url)
    message.success('Link copied to clipboard')
  }

  autoSchedule = () => {
    let major = this.majorChild ? this.majorChild.autoSchedule() : {}
    var majorCourses = this.majorChild ? major.selected : {}
    let selected = this.selectedChild.autoSchedule(majorCourses)
    var selectedCourses = selected.selected
    this.onParseAllScheduleComplete(parseSchedule(majorCourses, null), parseSchedule(selectedCourses, null), major, selected)
  }

  render() {
    const { major, classYear, courses, selectedCourses, loadFromUrl, urlData, generating } = this.state
    const options = courses.map((course, index) => {
      return (
        <Option key={index}>
          {course.department + ' ' + course.number + ' - ' + course.title}
        </Option>
      )
    })
    return (
      <Row>
        <Col xs={24} sm={24} md={11} lg={10} xl={8}>
          <AutoComplete
            className={styles.section}
            size="large"
            placeholder="Search by department, course number, CCC..."
            onSearch={this.handleSearch}
            onSelect={this.handleSelect}
            allowClear={true}
            autoCorrect={false}
          >
            {options}
          </AutoComplete>
          {major && classYear && <MajorCourseList major={major} classYear={classYear} ref={instance => { this.majorChild = instance }} parseScheduleCallback={this.onParseMajorScheduleComplete} parseScheduleFailed={this.onParseScheduleFailed} />}
          <SelectedCourseList ref={instance => { this.selectedChild = instance }} parseScheduleCallback={this.onParseOtherScheduleComplete} parseScheduleFailed={this.onParseScheduleFailed} loadFromUrl={loadFromUrl} urlData={urlData} />
          <ButtonGroup className={styles.section}>
            <Tooltip placement="bottom" title="Print schedule">
              <Button className={styles.actionButton} icon="printer" onClick={this.printSchedule} />
            </Tooltip>
            <Tooltip placement="bottom" title="Export CRNs">
              <Button className={styles.actionButton} icon="export" onClick={this.exportCRNs} />
            </Tooltip>
            <Tooltip placement="bottom" title="Generate link">
              <Button className={styles.actionButton} icon="link" onClick={this.generateUrl} />
            </Tooltip>
          </ButtonGroup>
          <div className={styles.section}>
            <Tooltip placement="bottom" title="Clear schedule and auto-generate">
              <Button className={styles.actionButtonLong} type="primary" onClick={this.autoSchedule}>GENERATE SCHEDULE</Button>
            </Tooltip>
          </div>
        </Col>
        <Col id="printSchedule" xs={24} sm={24} md={13} lg={14} xl={16}>
          <Spin 
            spinning={generating} 
            indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />}
            >
            <Week days={selectedCourses} />
          </Spin>
        </Col>
      </Row>
    )
  }
}

export default connect()(MainPage)
