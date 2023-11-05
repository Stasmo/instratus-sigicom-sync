const axios = require('axios');
const moment = require('moment-timezone');

module.exports = function(options = {}) {

  const client = axios.default.create({
    baseURL: options.baseURL || process.env.SIGICOM_BASE_URL,
    auth: {
      username: options.apiUser || process.env.SIGICOM_API_USER,
      password: options.apiToken || process.env.SIGICOM_API_TOKEN,
    }
  });

  client.interceptors.request.use(config => {
    // console.debug(config);
    return config;
  });

  /**
   * @returns {Promise} A promise that resolves to a json object representing the loggers.
   */
  async function getLoggers() {
    const response = await client.get(`/api/v1/logger/`);

    return response.data;
  }

  /**
   * @returns {Promise} A promise that resolves to a json object representing the devices.
   */
  async function getDevices() {
    const response = await client.get(`/api/v1/device/`);

    return response.data;
  }

  /**
   * @param {String} id The ID of the sensor
   *
   * @returns {Promise} A promise containing an axios response with the API data on resolution.
   */
  async function getSensor(id) {
    const response = await client.get(`/api/v1/sensor/${id}/`);

    return response.data;
  }

  /**
   * @returns {Promise} A promise containing an axios response with the API data on resolution.
   */
  async function getSensors() {
    const response = await client.get(`/api/v1/sensor/`);

    return response.data;
  }

  /**
   * @param {String} sensorId
   * @param {Date|String} from
   * @param {Date|String} to
   * @param {Boolean} transient
   * @param {Boolean} interval
   * @param {Boolean} monon
   * @param {Boolean} sio
   * @param {Boolean} blast
   *
   * @returns {Promise} A promise containing an axios response with the API data on resolution.
   */
  async function searchSensor(sensorId, from, to, transient, interval, monon, sio, blast) {
    // Dates must be in YYYY-MM-DD HH:mm format
    let postData = {
      datetime_from: moment(from).format("YYYY-MM-DD HH:mm")
    };

    // to is optional
    if (to) {
      postData["datetime_to"] = moment(to).format("YYYY-MM-DD HH:mm");
    }

    postData.data_types = {
      transient, interval, monon, sio, blast
    };

    const result = await client.post(`/api/v1/sensor/${sensorId}/search/`, postData);

    return result.data;
  }

  /**
   * @param {String} sensorId The ID of the sensor
   *
   * @returns {Promise} A promise containing an axios response with the API
   *                    data on resolution.
   */
  async function getSearchesForSensor(sensorId) {
    const result = await client.get(`/api/v1/sensor/${sensorId}/search/`);

    return result.data;
  }

  /**
   * @param {String} searchId The ID of the sigicom search object
   *
   * @returns {Promise} A promise containing an object with the properties
   *                    searchData and transientData, each containing the
   *                    response data for.
   */
  async function getSearchData(searchId) {
    console.log('Getting search data');
    let tries = 0;
    let error = null;
    while (tries++ < 5) {
      await new Promise(r => setTimeout(r, 2000 * tries));
      try {
        console.debug('Trying to retrieve data.');
        const response = await client.get(`/api/v1/search/${searchId}/data`);
        const searchData = response.data;

        return searchData;
      } catch(e) {
        error = e;
      }
    }

    throw error;
  }

  async function getDataForDevices(
    from,
    to = new Date(),
    devices = [],
    dataTypes = ['transient', 'interval']
  ) {
    console.log('Getting data for devices');

    let targetSensors = [];

    if (!devices || !devices.length) {
      targetSensors = await getSensors();
    } else {
      targetSensors = devices;
    }

    const searchInfo = await search(
      targetSensors,
      from.toUTCString(),
      to.toUTCString(),
      'UTC',
      dataTypes.includes('transient'),
      dataTypes.includes('interval'),
      dataTypes.includes('monon'),
      dataTypes.includes('sio'),
      dataTypes.includes('blast'),
    );

    const searchId = searchInfo.id;

    let running = true;

    do {
      await new Promise((r) => setTimeout(r, 10000));
      const searchResult = await getSearch(searchId);
      running = searchResult.state == 'running';

      if (searchResult.state == 'abort') {
        console.error('Search aborted.');
        throw Error(`Search aborted by sigicom. Abort reason: ${searchResult.abort_reason}`);
      }

    } while(running)

    const searchData = await getSearchData(searchId);

    return searchData;
  }

  /**
   *
   * @param {String} searchId  ID of the sigicom search
   * @param {String} transientKey  The ID of the transient event contained in the search.
   *
   * @returns {Object} Transient data for a given search.
   */
  async function getSearchTransientData(searchId, transientKey) {
    let tries = 0;
    let error = null;
    while (tries++ < 5) {
      await new Promise(r => setTimeout(r, 1000 * tries));
      try {
        console.debug('Trying to retrieve transient data.');
        const response = await client.get(`/api/v1/search/${searchId}/transient_key/${transientKey}`);
        const transientData = response.data;

        return transientData;
      } catch(e) {
        error = e;
      }
    }

    throw error;
  }

  /**
   *
   * @param {String} transientKey  The ID of the transient event contained in the search.
   *
   * @returns {Object} Transient data.
   */
  async function getTransientData(transientKey, options) {
    let tries = 0;
    let error = null;
    while (tries++ < 5) {
      await new Promise(r => setTimeout(r, 1000 * tries));
      try {
        console.debug('Trying to retrieve transient data.');
        const response = await client.get(
          `/api/v1/search/transient_key/${encodeURIComponent(transientKey)}`,
          options,
        );
        const transientData = response.data;

        return transientData;
      } catch(e) {
        error = e;
      }
    }

    throw error;
  }

  /**
   * @returns {Object} A list of search objects.
   */
  async function getSearches() {
    const response = await client.get(`/api/v1/search/`);

    return response.data;
  }

  /**
   * @param {String} id
   *
   * @returns {Object} Search metadata data.
   */
  async function getSearch(id) {
    const response = await client.get(`/api/v1/search/${id}`);

    return response.data;
  }

  /**
   * This was used to create the API.md in the root of the project.
   *
   * @param {String} api The path of the API
   *
   * @returns Documentation for the API.
   */
  async function getDoc(api) {
    const response = await client.get(`/apidoc/path/api/v1/${api}`, {
      Accept: 'application/octet-stream'
    });

    return response.data;
  }

  /**
   *
   * @param {Array.<{ type: String, serial: String|Number }>} sensors An array of objects with type and serial properties
   * @param {Date} fromDate
   * @param {Date} toDate
   * @param {String} timezone
   * @param {Boolean} transient
   * @param {Boolean} interval
   * @param {Boolean} monon
   * @param {Boolean} sio
   * @param {Boolean} blast
   *
   * @returns {Promise} A promise containing an axios response with the API data on resolution.
   */
  async function search(devices, fromDate, toDate, timezone, transient, interval, monon, sio, blast) {
    const response = await client.post(`/api/v1/search`, {
      devices,
      datetime_from: moment(fromDate).tz(timezone).format('YYYY-MM-DD HH:mm'),
      datetime_to: toDate ? moment(toDate).tz(timezone).format('YYYY-MM-DD HH:mm') : undefined,
      timezone,
      transient,
      interval,
      monon,
      sio,
      blast
    });

    return response.data;
  }

  return {
    getDataForDevices,
    getDevices,
    getDoc,
    getLoggers,
    getSearch,
    getSearchData,
    getSearches,
    getSearchesForSensor,
    getSearchTransientData,
    getSensor,
    getSensors,
    getTransientData,
    search,
    searchSensor,
  }
}
