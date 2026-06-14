import express from 'express';
import authRoutes from './routes/authRoutes';
import animalRoutes from './routes/animalRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import adoptionRoutes from './routes/adoptionRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import medicalRecordsRoutes from './routes/medicalRecordsRoutes';
import vetsRoutes from './routes/vetsRoutes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { startAnimalStatusJob } from './jobs/animalStatus.job';

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://shelter-with-ai-chatbox.vercel.app'
        : 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/contact', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/vets', vetsRoutes);

startAnimalStatusJob();

export default app;
