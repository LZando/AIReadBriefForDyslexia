const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(port, () => {
  console.log(`Server on http://localhost:${port}`);
});
