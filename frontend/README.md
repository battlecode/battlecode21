# Battlecode Frontend

Fully static frontend in React, based on `battlecode19/app`, using modified template from http://creative-tim.com. 

## Local Development

### First-Time Setup

In this directory, run:

```
npm install
```

### Running

Make sure that the backend in `../backend` is running at `localhost:8000`.

In this directory, run:

```
npm run start
```

This automatically reloads the page on changes. To run the same thing without automatically opening a browser, run `npm run startx`, and then navigate to http://localhost:3000.

### Notes

When installing a new Node package, always `npm install --save <package>` or `npm install --save-dev <package>`, and commit `package.json` and `package-lock.json`.

## Deployment

For production, build with `npm run build`.
