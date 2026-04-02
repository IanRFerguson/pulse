# Pulse
## An Engineering Manager's Productivity Portal
This app provides a clean, centralized overview of your team's productivity by measuring IC's sprint load, outstanding PRs, and assigned Freshdesk tickets in one panel.

| Codebase | Description | Docs |
| --- | --- | --- |
| Data Pipeline | This codebase hosts the `dlt` and `dbt` configurations to load and transform data for our frontend | [Link](./src/data-pipeline/README.md) |
| Web App | This codebase defines the Flask backend and React frontend to serve as the user interface | [Link](./src/web-app/README.md) |

## Roadmap
### Backend
- [x] Data syncing from GitHub
- [x] Data syncing from Asana
- [x] Data syncing from Freshdesk
- [ ] Data is modeled with dbt to produce IC-level summary models
- [ ] Flask connects to Postgres and serves the responses
- [ ] SQLAlchemy models IC profiles to tether them to data sources

### Frontend
- [ ] Dashboard lists open PRs, assigned tickets, and Asana stories
- [ ] All of these resources have qualified links that allow us to easily click into them
- [ ] We can see how long things have been assigned to identify bottlenecks