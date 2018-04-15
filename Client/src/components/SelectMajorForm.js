import React, { Component } from 'react'
import { Form, Select, Button } from 'antd'
import majorsData from '../data/majors'
import { CLASS_YEARS } from '../utils/variables'

const FormItem = Form.Item
const Option = Select.Option

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field])
}

class SelectMajorForm extends Component {
  componentDidMount() {
    // To disabled submit button at the beginning.
    this.props.form.validateFields()
  }

  majors = majorsData

  handleSubmit = e => {
    e.preventDefault()
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values)
        this.props.history.push(`/${values.major}/${values.classYear}`)
      }
    })
  }

  render() {
    const { getFieldDecorator, getFieldsError, getFieldError, isFieldTouched } = this.props.form

    // Only show error after a field is touched.
    const majorError = isFieldTouched('major') && getFieldError('major')
    const classYearError = isFieldTouched('classYear') && getFieldError('classYear')
    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <FormItem
          validateStatus={majorError ? 'error' : ''}
          help={majorError || ''}
          >
          {getFieldDecorator('major', {
            rules: [{ required: true, message: 'Please input your major!' }],
          })(
            <Select
              showSearch
              style={{ width: 260 }}
              placeholder="Select your major"
              optionFilterProp="children"
              onChange={this.handleMajorChange}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              >
              {Object.keys(this.majors).map(major => <Option key={major} value={major}>{this.majors[major].name}</Option>)}
            </Select>
          )}
        </FormItem>
        <FormItem
          validateStatus={classYearError ? 'error' : ''}
          help={classYearError || ''}
          >
          {getFieldDecorator('classYear', {
            rules: [{ required: true, message: 'Please input your class year!' }],
          })(
            <Select
              showSearch
              style={{ width: 180 }}
              placeholder="Select your class year"
              optionFilterProp="children"
              onChange={this.handleClassYearChange}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              >
              {CLASS_YEARS.map((year, index) => <Option key={index} value={3-index}>{year}</Option>)}
            </Select>
          )}
        </FormItem>
        <br /><br />
        <FormItem>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(getFieldsError())}
            >
            Get Started
          </Button>
        </FormItem>
      </Form>
    )
  }
}

export default Form.create()(SelectMajorForm)
