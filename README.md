# DevRPG

### Requirements
- NodeJS
- GitLab server
- Firebase server

### Usage

```js
new DevRPG(config).run('/', 3000, (commits) => {
  console.log(`Detected ${commits.length} new commit(s)`);
});
```