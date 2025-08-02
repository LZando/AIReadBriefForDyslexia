const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const apiRoutes = require('./api/routes');
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server on http://localhost:${port}`);
});
