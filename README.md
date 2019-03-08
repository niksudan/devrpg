# DevRPG - Gamifying Git

⚠️ **Redevelopment Ongoing!**

I'm currently in the process of redeveloping this into a more efficient git hook service. Check out my progress over on the [v2 branch](https://github.com/niksudan/devrpg/tree/v2).

---

Earn experience points in various programming skills by committing to a repository. Level up when you get enough EXP, and beat other contributors at their own game.

## Requirements

- **Node.js** for application running
- **Firebase** for data storage
- **GitLab** for source control

## Usage

- Specify Firebase and GitLab connection information in a `config.json` using the template provided
- Pass these parameters into a new `DevRPG` instance and run the server using the `run(path, port, callback)` method
- The callback returns the new commits stored into the database

Example:

```js
const DevRPG = require('./src/devrpg');
const config = require('./config');

new DevRPG(config).run('/', 3000, (commits) => {
  console.log(`Stored ${commits.length} new commit(s)`);
});
```

### Conditional Skills

Various skills are parsed automatically via `data/skills.json`, but some skills require a tag on a repository in GitLab. It's recommended you only put up to one tag of each category on a repository.

#### JavaScript

- `angular`
- `react`

#### PHP

- `laravel`
- `codeigniter`
- `wordpress`

## EXP Calculation

EXP for each commit is calculated in the following way:

- Determine if a file has a trackable skill (via `data/skills.json`) and is not ignored (via `data/ignores.json`)
- Award from 10 - 50 EXP per skill depending on the total number of additions
- Apply up to 20 EXP per skill if a big number of files have been modified globally

## Future Features

- GitHub integration
- Bitbucket integration
