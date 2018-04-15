import React, { Component } from 'react';
import style from '../../css/schedule.css';

class Event extends Component {
  state = {
    text: '',
    textStyle: null
  }

  componentDidMount() {
    this.setState({
      text: this.props.name,
      textStyle: style.eventTitle
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      text: nextProps.name,
      textStyle: style.eventTitle
    })
  }

  onMouseover = e => {
    this.setState({
      text: this.props.time,
      textStyle: style.eventLocation
    })
  }

  onMouseout = e => {
    this.setState({
      text: this.props.name,
      textStyle: style.eventTitle
    })
  }

  render() {
    const { width, height, top, left, color } = this.props
    let s = {
      width: `${width * 100}%`,
      height: `${height * 100}%`,
      top: `${top * 100}%`,
      left: `${left * 100}%`
    };
    return (
      <div className={style.eventContainer} style={s}>
        <div className={style.eventPadding}>
          <div className={style.event} style={{backgroundColor: color}}>
            <div 
              className={this.state.textStyle} 
              onMouseEnter={this.onMouseover.bind(this)} 
              onMouseLeave={this.onMouseout.bind(this)}
              >
              {this.state.text}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Event;
