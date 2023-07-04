## Install

Clone the repo and install dependencies:

```bash
npm install
```


## Starting Development

HTML directory must be placed before running the project. HTML directory is not included in git due to size limitations.
Manually copy the extracted html directory at below path:
`release/app/html`

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

Before packaging app make sure you've below html directories inside `release` directory:
- htmlLoggedIn (Auth/LoggedIn version)
- htmlLoggedOut (LoggedOut version)

Note: Names of directories must be same as mentioned above.

To package apps for the local platform:

For LoggedOut version:
```bash
npm run package
```

For LoggedIn/Auth version:
```bash
npm run package:auth
```
