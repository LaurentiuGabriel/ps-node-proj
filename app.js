// app.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());

let users = [];
let posts = [];
let userIdCounter = 1;
let postIdCounter = 1;


// --- GUI Route ---
// This route serves the HTML for the front-end interface
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Lab Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            background: #0F172A; /* fallback */
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
        }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        
        /* Glassmorphism Card with Gradient Border */
        .card-wrapper {
            background: linear-gradient(135deg, #38BDF8, #818CF8);
            padding: 1px;
            border-radius: 0.75rem;
        }
        .card { 
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(12px) saturate(150%);
            border-radius: 0.7rem;
        }
        .card-title-icon {
            width: 24px;
            height: 24px;
            stroke-width: 2;
            margin-right: 0.75rem;
        }
        .btn-primary {
            background: linear-gradient(135deg, #38BDF8, #818CF8);
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(56, 189, 248, 0.2);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(129, 140, 248, 0.3);
        }
        .form-input {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid #334155;
        }
        .form-input:focus {
            border-color: #38BDF8;
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748B; }
    </style>
</head>
<body class="text-slate-200">

    <div class="container mx-auto p-4 md:p-8">
        <header class="text-center mb-12">
            <h1 class="font-poppins text-5xl font-bold text-white">API Dashboard</h1>
            <p class="text-slate-400 mt-2">View and manage users and posts.</p>
        </header>

        <div id="message-box" class="fixed top-5 right-5 z-50 hidden p-4 rounded-lg text-white font-semibold shadow-lg"></div>

        <main class="grid lg:grid-cols-2 gap-8">

            <!-- Users Section -->
            <section id="users-section">
                <div class="card-wrapper">
                    <div class="card h-full flex flex-col">
                        <h2 class="font-poppins text-2xl font-semibold p-4 text-white flex items-center border-b border-slate-700">
                             <svg class="card-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path stroke-linecap="round" stroke-linejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Users
                        </h2>
                        <div id="users-list" class="p-4 space-y-3 flex-grow custom-scrollbar overflow-y-auto min-h-[200px] max-h-96">
                            <!-- User data will be injected here -->
                        </div>
                        <div class="p-4 border-t border-slate-700">
                            <h3 class="font-poppins font-bold mb-3 text-lg text-white">Add New User</h3>
                            <form id="add-user-form" class="space-y-4">
                                <input type="text" id="name" placeholder="Name" class="form-input w-full rounded-md p-2 focus:outline-none">
                                <input type="email" id="email" placeholder="Email" class="form-input w-full rounded-md p-2 focus:outline-none">
                                <button type="submit" class="btn-primary w-full text-white font-bold py-2.5 px-4 rounded-md">Add User</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Posts Section -->
            <section id="posts-section">
                 <div class="card-wrapper">
                    <div class="card h-full flex flex-col">
                        <h2 class="font-poppins text-2xl font-semibold p-4 text-white flex items-center border-b border-slate-700">
                           <svg class="card-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            Posts
                        </h2>
                        <div id="posts-list" class="p-4 space-y-4 flex-grow custom-scrollbar overflow-y-auto min-h-[200px] max-h-[34.5rem]">
                            <!-- Post data will be injected here -->
                        </div>
                    </div>
                </div>
            </section>

        </main>
    </div>

    <script>
        const usersList = document.getElementById('users-list');
        const postsList = document.getElementById('posts-list');
        const addUserForm = document.getElementById('add-user-form');
        const messageBox = document.getElementById('message-box');

        // --- Data Fetching and Rendering ---
        const createSkeletonLoader = (count = 3) => {
            let loaderHTML = '';
            for(let i=0; i< count; i++) {
                loaderHTML += \`
                <div class="p-3 bg-slate-800/50 rounded-md animate-pulse">
                    <div class="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
                    <div class="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>\`;
            }
            return loaderHTML;
        }

        const showMessage = (message, isError = false) => {
            messageBox.textContent = message;
            messageBox.className = isError 
                ? 'p-4 rounded-lg text-white font-semibold shadow-lg bg-red-600' 
                : 'p-4 rounded-lg text-white font-semibold shadow-lg bg-green-500';
            messageBox.classList.remove('hidden');
            setTimeout(() => {
                messageBox.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                setTimeout(() => messageBox.classList.add('hidden'), 300);
            }, 3000);
        };

        const fetchUsers = async () => {
            usersList.innerHTML = createSkeletonLoader();
            try {
                const response = await fetch('/users');
                const users = await response.json();
                usersList.innerHTML = ''; // Clear loader
                if(users.length === 0) {
                    usersList.innerHTML = '<p class="text-slate-500 text-center p-4">No users found.</p>';
                    return;
                }
                users.forEach(user => {
                    const userEl = document.createElement('div');
                    userEl.className = 'p-3 bg-slate-800/50 rounded-md hover:bg-slate-700/50 transition-colors duration-200';
                    userEl.innerHTML = \`
                        <p class="font-semibold text-white">\${user.name}</p>
                        <p class="text-sm text-slate-400">\${user.email}</p>
                    \`;
                    usersList.appendChild(userEl);
                });
            } catch (err) {
                usersList.innerHTML = '<p class="text-red-400 text-center p-4">Failed to fetch users.</p>';
            }
        };

        const fetchPosts = async () => {
            postsList.innerHTML = createSkeletonLoader(5);
            try {
                const response = await fetch('/posts');
                const posts = await response.json();
                postsList.innerHTML = ''; // Clear loader
                if(posts.length === 0) {
                    postsList.innerHTML = '<p class="text-slate-500 text-center p-4">No posts found.</p>';
                    return;
                }
                posts.forEach(post => {
                    const postEl = document.createElement('div');
                    postEl.className = 'p-4 bg-slate-800/50 rounded-md hover:bg-slate-700/50 transition-colors duration-200';
                    postEl.innerHTML = \`
                        <h4 class="font-poppins font-bold text-lg text-white">\${post.title}</h4>
                        <p class="text-slate-300 mb-2">\${post.content}</p>
                        <p class="text-sm text-slate-500">By: \${post.author ? post.author.name : 'Unknown'}</p>
                    \`;
                    postsList.appendChild(postEl);
                });
            } catch (err) {
                 postsList.innerHTML = '<p class="text-red-400 text-center p-4">Failed to fetch posts.</p>';
            }
        };

        // --- Event Listeners ---
        
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const button = e.target.querySelector('button');

            if (!name || !email) {
                showMessage('Please fill in all fields.', true);
                return;
            }
            
            button.disabled = true;
            button.textContent = 'Adding...';

            try {
                const response = await fetch('/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email })
                });
                
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to create user.');
                }

                showMessage('User added successfully!');
                addUserForm.reset();
                fetchUsers(); // Refresh the user list
            } catch (err) {
                showMessage(err.message, true);
            } finally {
                button.disabled = false;
                button.textContent = 'Add User';
            }
        });

        // Initial data load
        document.addEventListener('DOMContentLoaded', () => {
            fetchUsers();
            fetchPosts();
        });
    </script>
</body>
</html>
    `);
});


// --- API Routes ---

// Get all users
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// Create a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Missing name or email' });
  }

  // Check for duplicate email
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const newUser = { id: userIdCounter++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Get all posts
app.get('/posts', (req, res) => {
  const populatedPosts = posts.map(post => {
    const author = users.find(u => u.id === post.authorId);
    return {
      ...post,
      author: { name: author?.name || 'Unknown' }
    };
  });
  res.status(200).json(populatedPosts);
});

app.post('/posts', (req, res) => {
  const { title, content, authorId } = req.body;
  if (!title || !content || !authorId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const userExists = users.find(u => u.id === authorId);
  if (!userExists) {
    return res.status(404).json({ message: 'Author not found' });
  }

  const newPost = { id: postIdCounter++, title, content, authorId };
  posts.push(newPost);
  res.status(201).json(newPost);
});



// Get external data and combine with local data
// This route simulates fetching data from a third-party service
app.get('/posts-with-external-data', async (req, res) => {
  try {
    const populatedPosts = posts.map(post => {
      const author = users.find(u => u.id === post.authorId);
      return {
        ...post,
        author: { name: author?.name || 'Unknown' }
      };
    });

    const externalApiResponse = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    if (!externalApiResponse.ok) {
      throw new Error('Failed to fetch external data');
    }
    const externalData = await externalApiResponse.json();

    const combinedData = populatedPosts.map(post => ({
      ...post,
      externalInfo: `External task: "${externalData.title}"`
    }));

    res.status(200).json(combinedData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combined data', error: error.message });
  }
});


// --- Error Handling for non-existent routes ---
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = {
  app,
  __test_data__: {
    users,
    posts,
    resetData: () => {
      users.length = 0;
      posts.length = 0;
      userIdCounter = 1;
      postIdCounter = 1;
    }
  }
};

