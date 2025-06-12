// server.js
const { app } = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
// Note: In a real app, this would come from a .env file
const MONGO_URI = 'mongodb://localhost:27017/integration-lab';

// Do not start the server or connect to the DB if in a test environment
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`GUI is available at http://localhost:${PORT}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err);
    });
}