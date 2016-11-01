# DevRPG

**Gamifying Git**

Earn experience points in various programming skills by committing to a repository. Level up when you get enough EXP, and beat other contributors at their own game.

## Requirements
- **Node.js** for application running
- **Firebase** for data storage
- **GitLab** for source control

## Usage

- Specify Firebase and GitLab connection information in `config.json`
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

## Future Features
- GitHub integration
- Bitbucket integration
