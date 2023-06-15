import { resolveHtmlPath } from './util';

const express = require('express');

const app = express();

// Serve static files from the public directory
app.use(express.static(resolveHtmlPath()));

const server: any = app.listen(80); // Start the server on port 80

export default () => console.log('Server started on http://localhost:80');
export { server };
