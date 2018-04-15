import React from 'react';
import map from 'lodash/map';
import BackgroundTimeline from './BackgroundTimeline';
import Day from './Day';
import style from '../../css/schedule.css';

const Week = ({ days }) => {
  return (
    <div className={style.container}>
      <div className={style.eventsContainer}>
        <BackgroundTimeline>
          {
            map(days, (d, i) => {
              return <div key={`day-${i}`} className={style.weekDay}><Day events={d} /></div>;
            })
          }
        </BackgroundTimeline>
      </div>
    </div>
  );
}

export default Week;
