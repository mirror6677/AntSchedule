import React, { Component } from 'react'
import { Form, Button } from 'antd'

const FormItem = Form.Item

class StarterForm extends Component {
	componentDidMount() {
	    // To disabled submit button at the beginning.
	    this.props.form.validateFields()
	}

	handleSubmit = e => {
		e.preventDefault()
		this.props.history.push('/main')
	}

	render() {
		return (
			<Form layout="inline" onSubmit={this.handleSubmit}>
			    <FormItem>
		      		<Button
			        	type="primary"
			        	htmlType="submit"
      				>
			       		Get Started
		      		</Button>
			    </FormItem>
			</Form>
		)
	}
}

export default Form.create()(StarterForm)
