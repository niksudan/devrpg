# DevRPG

### Requirements
- NodeJS
- GitLab server
- Firebase server

### Usage

```js
new DevRPG(config).run('/', 3000, (commits) => {
  console.log(`Stored ${commits.length} new commit(s)`);
});
```
