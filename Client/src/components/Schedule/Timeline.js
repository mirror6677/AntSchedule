import React from 'react';
import { HOURS_PER_DAY } from './constants';
import style from '../../css/schedule.css';

const Timeline = () => {
  let steps = [];
  for (var i = 7; i < 7 + HOURS_PER_DAY; i++) {
    let h = i > 7 ? ( i < 12 ? `${i}am` : `${i}pm`) : null;
    steps.push(
      <div key={`step-${i}`} className={style.timelineStep}>{h}</div>
    );
  }

  return (
    <div className={style.timelineContainer}>
      <div className={style.timeline}>
        <div className={style.timelineStepsContainer}>{steps}</div>
      </div>
    </div>
  );
};

export default Timeline;
