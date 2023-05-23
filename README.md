# Alerts influxDB 2 Jira

This is a project to open a ticket in jira when a value has some time to appear in a time series from a bucket in influxDB.

## For development

### Prerequisites

| Node | v18.15.0 |
|------|----------|
| NPM  | 9.5.0    |

### Before starting

- Copy .env.example to .env and fill the information
- Copy queries.json.example to queries.json and add your flux queries

### How to start

```bash
npm run start
```