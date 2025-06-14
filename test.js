const request = require('supertest');
const nock = require('nock');
const { app, __test_data__ } = require('./app'); // Import app and in-memory store
const { users, posts, resetData } = __test_data__;

let server;

beforeAll(() => {
  server = app;
});

afterEach(() => {
  nock.cleanAll();
  resetData(); // Clear in-memory data
});

describe('User API', () => {
  it('should create a new user successfully', async () => {
    const newUser = { name: 'John Doe', email: 'john.doe@example.com' };

    const response = await request(server)
      .post('/users')
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newUser.name);
    expect(response.body.email).toBe(newUser.email);

    // Validate in-memory storage
    const storedUser = users.find(u => u.id === response.body.id);
    expect(storedUser).toBeDefined();
    expect(storedUser.name).toBe(newUser.name);
  });

  it('should return 400 if required user fields are missing', async () => {
    const response = await request(server)
      .post('/users')
      .send({ name: 'Just a name' }) // Missing email
      .expect(400);

    expect(response.body.message).toBe('Missing name or email');
  });

  it('should fetch all users', async () => {
    users.push(
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    );

    const response = await request(server).get('/users').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    expect(response.body[0].name).toBe('Alice');
  });
});

describe('Posts API', () => {
  it('should fetch posts and combine them with mocked external data', async () => {
    // Setup in-memory data
    users.push({ id: 1, name: 'Jane Doe', email: 'jane@example.com' });
    posts.push({ id: 1, title: 'My First Post', content: 'Hello World', authorId: 1 });

    nock('https://jsonplaceholder.typicode.com')
      .get('/todos/1')
      .reply(200, { id: 1, title: 'delectus aut autem', completed: false });

    const response = await request(server)
      .get('/posts-with-external-data')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('My First Post');
    expect(response.body[0].externalInfo).toBe('External task: "delectus aut autem"');
  });

  it('should handle errors when the external API call fails', async () => {
    nock('https://jsonplaceholder.typicode.com')
      .get('/todos/1')
      .reply(500, { message: 'External Service Down' });

    const response = await request(server)
      .get('/posts-with-external-data')
      .expect(500);

    expect(response.body.message).toBe('Error fetching combined data');
  });
});

describe('Error Handling', () => {
  it('should return 404 for a non-existent route', async () => {
    const response = await request(server).get('/non-existent-path').expect(404);
    expect(response.body.message).toBe('Not Found');
  });
});
