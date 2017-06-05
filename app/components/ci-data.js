import Ember from 'ember';
import { task } from 'ember-concurrency';
import moment from 'moment';

export default Ember.Component.extend({
  data: null,
  upload: task(function * (files){
    const file = files[0];
    const reader = new FileReader();
    reader.onload = e => {
      const data = this.parseEventXml(e);
      this.set('data', data);
    };
    reader.readAsText(file);
  }),
  parseEventXml(e){
    const data = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");
    const events = Ember.$(xmlDoc).find('Event');
    const mappedData = events.map(function(){
      const event = Ember.$(this);
      const duration = event.find('EventDuration:eq(0)').text();
      const instructionalMethod = event.find('InstructionalMethod:eq(0)').text();
      return { duration, instructionalMethod };
    });

    const eventsDuration = mappedData.toArray().map(obj => {
      const duration = moment.duration(obj.duration).as('seconds');

      return { instructionalMethod: obj.instructionalMethod, duration};
    });

    let chartObj = {};

    eventsDuration.forEach(obj => {
      if (!(obj.instructionalMethod in chartObj)) {
        chartObj[obj.instructionalMethod] = 0
      }

      chartObj[obj.instructionalMethod] += obj.duration;
    });

    const chartData =  Object.keys(chartObj).map(label => {
      return {
        label,
        data: chartObj[label]
      };
    });

    return chartData;
  },
});
