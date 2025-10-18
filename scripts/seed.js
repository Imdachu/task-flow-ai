require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../src/models/Project');
const Column = require('../src/models/Column');
const Task = require('../src/models/Task');

async function seed() {
  try {
    // Connect to DB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not set in .env file');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Task.deleteMany({});
    await Column.deleteMany({});
    await Project.deleteMany({});
    console.log('Cleared all data');

    // Create sample projects
    console.log('Creating sample data...');

    // Project 1: Web Development
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
    });

    const project1Columns = await Column.insertMany([
      { projectId: project1._id, title: 'To Do' },
      { projectId: project1._id, title: 'In Progress' },
      { projectId: project1._id, title: 'Done' },
    ]);

    await Task.insertMany([
      {
        projectId: project1._id,
        columnId: project1Columns[0]._id,
        title: 'Design homepage mockup',
        description: 'Create Figma designs for new homepage layout',
        position: 1,
      },
      {
        projectId: project1._id,
        columnId: project1Columns[0]._id,
        title: 'Set up React project',
        description: 'Initialize React with Vite and install dependencies',
        position: 2,
      },
      {
        projectId: project1._id,
        columnId: project1Columns[1]._id,
        title: 'Implement navbar component',
        description: 'Build responsive navigation bar with mobile menu',
        position: 1,
      },
      {
        projectId: project1._id,
        columnId: project1Columns[2]._id,
        title: 'Set up MongoDB database',
        description: 'Configure MongoDB Atlas and create initial schemas',
        position: 1,
      },
    ]);

    // Project 2: Mobile App
    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
    });

    const project2Columns = await Column.insertMany([
      { projectId: project2._id, title: 'To Do' },
      { projectId: project2._id, title: 'In Progress' },
      { projectId: project2._id, title: 'Done' },
    ]);

    await Task.insertMany([
      {
        projectId: project2._id,
        columnId: project2Columns[0]._id,
        title: 'Research React Native vs Flutter',
        description: 'Compare frameworks and make technology decision',
        position: 1,
      },
      {
        projectId: project2._id,
        columnId: project2Columns[0]._id,
        title: 'Design app wireframes',
        description: 'Create low-fidelity wireframes for all screens',
        position: 2,
      },
      {
        projectId: project2._id,
        columnId: project2Columns[1]._id,
        title: 'Implement authentication',
        description: 'Set up user login with OAuth',
        position: 1,
      },
    ]);

    // Project 3: API Integration
    const project3 = await Project.create({
      name: 'Third-party API Integration',
      description: 'Integrate payment gateway and analytics',
    });

    const project3Columns = await Column.insertMany([
      { projectId: project3._id, title: 'To Do' },
      { projectId: project3._id, title: 'In Progress' },
      { projectId: project3._id, title: 'Done' },
    ]);

    await Task.insertMany([
      {
        projectId: project3._id,
        columnId: project3Columns[0]._id,
        title: 'Integrate Stripe payment',
        description: 'Set up Stripe SDK and webhook handlers',
        position: 1,
      },
      {
        projectId: project3._id,
        columnId: project3Columns[2]._id,
        title: 'Add Google Analytics',
        description: 'Integrate GA4 tracking',
        position: 1,
      },
    ]);

    console.log('✅ Seed data created successfully!');
    console.log(`
Created:
- ${await Project.countDocuments()} projects
- ${await Column.countDocuments()} columns
- ${await Task.countDocuments()} tasks

Projects:
1. ${project1.name} (${await Task.countDocuments({ projectId: project1._id })} tasks)
2. ${project2.name} (${await Task.countDocuments({ projectId: project2._id })} tasks)
3. ${project3.name} (${await Task.countDocuments({ projectId: project3._id })} tasks)
    `);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
