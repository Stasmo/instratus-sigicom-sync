function formatData({ intervals, transients, meta }) {
  const allIntervals = [];
  const allTransients = [];

  const serials = meta.devices.map(d => d.serial.toString());

  intervals.forEach(interval => {
    serials.forEach(serial => {
      allIntervals.push(...interval[serial].intervals.map(i => ({
        ...i,
        serial,
        datetime: interval.datetime,
      })));
    });
  });

  // Fill in max column with "value" if max is undefined
  allIntervals.forEach(i => {
    if (i['max'] === undefined) {
      i.max = i.max || i.value
    }
  });

  transients.forEach(transient => {
    serials.forEach(serial => {
      allTransients.push(...transient[serial].transients.map(i => ({
        ...i,
        serial,
        datetime: transient.datetime,
      })));
    });
  });

  return { intervals: allIntervals, transients: allTransients };
}

// This is how we used to format interval data.
function formatIntervalData(data) {

  const byIdAndTimestamp = {};

  data.forEach(interval => {
    Object.entries(interval).forEach(([deviceId, values]) => {
      values.intervals?.forEach(value => {
        const id = `${deviceId}${interval.timestamp}`;
        byIdAndTimestamp[id] = byIdAndTimestamp[id] || {};
        byIdAndTimestamp[id].id = deviceId;
        byIdAndTimestamp[id].timestamp = interval.timestamp;
        byIdAndTimestamp[id][value.label] = value.max;
      })
    })
  });

  return Object.values(byIdAndTimestamp);
}

// This is how we used to format transient data.
function formatTransientData(data) {

  return data.flatMap(event => {
    return Object.entries(event)
    .filter(([s, result]) => result.transients)
    .flatMap(([serial, result]) => result.transients.map(t => {
      const objectKey = `sigicom/${serial}/transient/${t.timestamp}/${t.label}.json.gz`;

      t.deviceId = serial;
      t.s3Key = objectKey;
      t.id = serial;

      return t;
    }));
  });
}

module.exports = {
  formatIntervalData,
  formatTransientData,
  formatData,
};
