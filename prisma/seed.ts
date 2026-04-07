import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const adminPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    const admin = await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL },
      update: { role: 'ADMIN' },
      create: {
        email: env.ADMIN_EMAIL,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    console.log(`Created admin: ${admin.email}`);
  }

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: teacherPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'TEACHER',
      bio: 'Professeur en informatique et science des donnees.',
    },
  });
  console.log(`Created teacher: ${teacher.email}`);

  // Create student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: studentPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'STUDENT',
      bio: 'Etudiante en master informatique.',
    },
  });
  console.log(`Created student: ${student.email}`);

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { slug: 'introduction-python-seed' },
    update: {},
    create: {
      title: 'Introduction a Python',
      description: 'Apprenez les bases de la programmation Python : variables, boucles, fonctions et structures de donnees.',
      slug: 'introduction-python-seed',
      fileType: 'MARKDOWN',
      originalFileName: 'intro-python.md',
      filePath: './uploads/seed-intro-python.md',
      contentHTML: '<div class="course-content markdown-body"><h1>Introduction a Python</h1><p>Bienvenue dans ce cours d\'introduction a Python.</p><h2>Variables</h2><pre><code class="language-python">x = 10\nname = "Hello"</code></pre></div>',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      views: 42,
      authorId: teacher.id,
    },
  });
  console.log(`Created course: ${course1.title}`);

  const course2 = await prisma.course.upsert({
    where: { slug: 'machine-learning-bases-seed' },
    update: {},
    create: {
      title: 'Bases du Machine Learning',
      description: 'Decouvrez les concepts fondamentaux du Machine Learning : regression, classification, et evaluation de modeles.',
      slug: 'machine-learning-bases-seed',
      fileType: 'NOTEBOOK',
      originalFileName: 'ml-basics.ipynb',
      filePath: './uploads/seed-ml-basics.ipynb',
      contentHTML: '<div class="course-content notebook-body"><div class="cell cell-markdown"><h1>Machine Learning Basics</h1></div><div class="cell cell-code"><pre><code class="language-python">import numpy as np\nimport pandas as pd</code></pre></div></div>',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      views: 128,
      authorId: teacher.id,
    },
  });
  console.log(`Created course: ${course2.title}`);

  const course3 = await prisma.course.upsert({
    where: { slug: 'draft-cours-avance-seed' },
    update: {},
    create: {
      title: 'Cours Avance - Brouillon',
      description: 'Ce cours est un brouillon non encore publie.',
      slug: 'draft-cours-avance-seed',
      fileType: 'MARKDOWN',
      originalFileName: 'advanced.md',
      filePath: './uploads/seed-advanced.md',
      contentHTML: '<div class="course-content markdown-body"><h1>Cours Avance</h1><p>En construction...</p></div>',
      status: 'DRAFT',
      views: 0,
      authorId: teacher.id,
    },
  });
  console.log(`Created course: ${course3.title}`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
