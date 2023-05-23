require('dotenv').config();

const { InfluxDB } = require('@influxdata/influxdb-client');
const axios = require('axios');

const queries = require('./queries.json');

/** Environment variables **/
const url = process.env.INFLUX_URL || '';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || '';

const jiraSiteUrl = process.env.JIRA_SITE_URL || '';
const jiraSiteAuth = process.env.JIRA_SITE_AUTH || '';
const jiraSiteProject = process.env.JIRA_SITE_PROJECT || '';
const jiraSiteIssuetype = process.env.JIRA_ISSUE_TYPE || '';


const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

const createJiraTicket = async (device, lastTime) => {
    try {
        const url = jiraSiteUrl;
        const auth = 'Basic ' + jiraSiteAuth;

        const payload = {
            fields: {
                summary: device + 'has 12 hours to report a value',
                issuetype: { id: jiraSiteIssuetype },
                project: { key: jiraSiteProject },
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    text: device + 'has 12 hours to report a value. Last time was' + lastTime,
                                    type: 'text',
                                },
                            ],
                        },
                    ],
                },
            },
        };

        const headers = {
            Authorization: auth,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        const response = await axios.post(url, payload, { headers });
        console.log('Ticket created successfully:', response.data);
    } catch (error) {
        console.error('Error creating ticket:', error.response.data);
    }
};

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
                    createJiraTicket(name, lastValue);
                    console.log(name + ': Last value is older than 12 Hours.');
                } else {
                    console.log(name + ': Last Time reported:', lastValue); // Print the last value
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