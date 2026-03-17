/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

import express, { urlencoded, json } from 'express';
import client from 'prom-client';
import mongoose from 'mongoose';

import path from 'path';
import favicon from 'serve-favicon';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { listUserUI, editUserUI } from './app/controllers/user.controller.js';
import { listTaskUI, editTaskUI } from './app/controllers/task.controller.js';

import v1UserRouter from './app/routes/user.routes.js';
import v1TaskRouter from './app/routes/task.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Prometheus metrics
client.collectDefaultMetrics();

// Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(favicon(path.join(__dirname, 'app', 'public', 'img', 'favicon.ico')));
app.use(urlencoded({ extended: true }));
app.use(json());

// View engine
app.set('views', path.join(`${__dirname}/app/views`));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/app/public'));

// Routes
app.use("/v1/users", v1UserRouter);
app.use("/v1/tasks", v1TaskRouter);

app.get('/users-ui/', listUserUI);
app.get('/users-ui/edit/:userId', editUserUI);
app.get('/tasks-ui/user/:userId', listTaskUI);
app.get('/tasks-ui/edit/:taskId', editTaskUI);

// Health route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Todo App.' });
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// 🔥 MongoDB Connection with Retry Logic (CRITICAL FIX)
const mongoURL = "mongodb://mongo:27017/todo-app";

async function connectWithRetry() {
  try {
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.log("⏳ Mongo not ready, retrying in 5s...");
    setTimeout(connectWithRetry, 5000);
  }
}

// Start DB connection
connectWithRetry();

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});
