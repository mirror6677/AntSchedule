import React from 'react';
import style from '../../css/schedule.css';
import { HOURS_PER_DAY } from './constants';

const BackgroundTimeline = ({ children }) => {
  let hours = [];
  for (var i = 7; i < 7 + HOURS_PER_DAY; i++) {
    hours.push(
      <div key={`hour-${i}`} className={style.eventsBackgroundHour}/>
    );
  }

  return (
    <div className={style.eventsBackgroundContainer}>
      <div className={style.eventsBackground}>{hours}</div>
      {children}
    </div>
  );
};

export default BackgroundTimeline;
