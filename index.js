require('dotenv').config();

const { InfluxDB } = require('@influxdata/influxdb-client');

/** Environment variables **/
const url = process.env.INFLUX_URL || '';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || '';

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

const queries = require('./queries.json');


const getLastValue = async (query) => {
    let lastValue = null; // Variable to store the last value

    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
        const o = tableMeta.toObject(values);
        lastValue = o._time; // Store the current value as the last value
    }

    return lastValue; // Return the last value
};

const executeQueries = async () => {
    for (const { name, query } of queries) {
        getLastValue(query)
            .then((lastValue) => {
                const now = new Date();
                const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                const lastValueTimestamp = new Date(Date.parse(lastValue));

                if (lastValueTimestamp < twelveHoursAgo) {
                    console.log(name + ': Last value is older than 10 secs.');
                } else {
                    console.log(name + ': Last Value:', lastValue); // Print the last value
                }
            })
            .catch((error) => {
                console.error('Error retrieving last value:', error);
            });
    }
};

// Schedule the query execution and response check every 30 minutes
setInterval(() => {
    executeQueries()
        .then(() => {
            console.log('Queries executed successfully.');
        })
        .catch((error) => {
            console.error('Error executing queries:', error);
        });
}, 5 * 1000);