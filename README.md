# DevRPG

DevRPG is an experimental application that gamifies git committing. You can earn experience points in various programming skills and level up. Try to beat co-workers and rank number one at the end of the month.

### Requirements
DevRPG runs on **Node.js** and uses **Firebase** to store it's data. It currently hooks into **GitLab** to fetch and parse commit data.

### Usage

```js
new DevRPG(config).run('/', 3000, (commits) => {
  console.log(`Stored ${commits.length} new commit(s)`);
});
```

### Future Features
- Additional source control integration (GitHub, Bitbucket, etc)
- Project management app integration (Basecamp, Trello, Asana, etc)
- Achievements
