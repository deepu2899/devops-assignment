const express = require('express');

const cors = require('cors');

const morgan = require('morgan');
 
const app = express();

const port = 3001;
 
// Simple in-memory storage for todos

let todos = [

  { id: 1, text: 'Learn DevOps', completed: false },

  { id: 2, text: 'Fix hardcoded values', completed: false },

  { id: 3, text: 'Deploy to production', completed: false }

];

let nextId = 4;
 
// ✅ CORS configuration

app.use(cors({
  origin: '*',
  credentials: true
}));
 
app.use(morgan('combined'));

app.use(express.json());
 
// Health check endpoint

app.get('/health', (req, res) => {

  res.json({ status: 'ok', timestamp: new Date().toISOString() });

});
 
// Get all todos

app.get('/api/todos', (req, res) => {

  res.json(todos);

});
 
// Create a new todo

app.post('/api/todos', (req, res) => {

  const { text } = req.body;
 
  if (!text) {

    return res.status(400).json({ error: 'Text is required' });

  }
 
  const newTodo = {

    id: nextId++,

    text: text,

    completed: false

  };
 
  todos.push(newTodo);

  res.status(201).json(newTodo);

});
 
// Update a todo

app.put('/api/todos/:id', (req, res) => {

  const id = parseInt(req.params.id);

  const { text, completed } = req.body;
 
  const todoIndex = todos.findIndex(todo => todo.id === id);
 
  if (todoIndex === -1) {

    return res.status(404).json({ error: 'Todo not found' });

  }
 
  if (text !== undefined) todos[todoIndex].text = text;

  if (completed !== undefined) todos[todoIndex].completed = completed;
 
  res.json(todos[todoIndex]);

});
 
// Delete a todo

app.delete('/api/todos/:id', (req, res) => {

  const id = parseInt(req.params.id);

  const todoIndex = todos.findIndex(todo => todo.id === id);
 
  if (todoIndex === -1) {

    return res.status(404).json({ error: 'Todo not found' });

  }
 
  todos.splice(todoIndex, 1);

  res.status(204).send();

});
 
// Error handling middleware

app.use((err, req, res, next) => {

  console.error('Unhandled error:', err);

  res.status(500).json({ error: err.message || 'Internal server error' });

});
 
// 404 handler

app.use((req, res) => {

  res.status(404).json({ error: 'Not found' });

});
 
// Start server

const server = app.listen(port, () => {

  console.log(`Todo API server running on port ${port}`);

});

 
