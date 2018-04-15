import React, { Component } from 'react'
import { connect } from 'dva'
import { Radio } from 'antd'
import styles from '../css/starterPage.css'
import SelectMajorForm from '../components/SelectMajorForm'
import StarterForm from '../components/StarterForm'

const RadioGroup = Radio.Group

class StarterPage extends Component {
  state = {
    showMajorSelection: true
  }

  onChange = e => {
    this.setState({
      showMajorSelection: e.target.value
    })
  }

  render() {
    return (
      <div className={styles.normal}>
        <h1 className={styles.title}>Welcome to AntSchedule!</h1>
        <div className={styles.welcome} />
        <RadioGroup onChange={this.onChange} value={this.state.showMajorSelection}>
          <Radio value={true}>Populate with major requirements (engineering majors only)</Radio>
          <Radio value={false}>Select your own courses</Radio>
        </RadioGroup>
        <br /><br />
        { this.state.showMajorSelection ? 
        <SelectMajorForm history={this.props.history} /> :
        <StarterForm history={this.props.history} /> }
      </div>
    )
  }
}

StarterPage.propTypes = {
}

export default connect()(StarterPage)
