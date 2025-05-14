import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from './models/User';
import { exit } from 'process';


dotenv.config({ path: '../.env' });


const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz_game';


const createUsers = async () => {
  try {
    
    await User.deleteMany({});
    console.log('Felhasználók törölve');

    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@kvizjatek.hu',
      password: 'admin123',
      role: UserRole.ADMIN
    });

    
    const player1 = await User.create({
      username: 'jatekos1',
      email: 'jatekos1@kvizjatek.hu',
      password: 'jatekos123',
      role: UserRole.PLAYER,
      score: 0
    });

    const player2 = await User.create({
      username: 'jatekos2',
      email: 'jatekos2@kvizjatek.hu',
      password: 'jatekos123',
      role: UserRole.PLAYER,
      score: 0
    });

    const player3 = await User.create({
      username: 'jatekos3',
      email: 'jatekos3@kvizjatek.hu',
      password: 'jatekos123',
      role: UserRole.PLAYER,
      score: 0
    });

    console.log('Felhasználók létrehozva');
    return { admin, player1, player2, player3 };
  } catch (error) {
    console.error('Hiba a felhasználók létrehozásakor:', error);
    throw error;
  }
};



const seedDatabase = async () => {
  try {
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB kapcsolódva');

    
    const users = await createUsers();
;

    console.log('Adatbázis feltöltése sikeres');
    mongoose.connection.close();
    exit(0);
  } catch (error) {
    console.error('Hiba az adatbázis feltöltésekor:', error);
    mongoose.connection.close();
    exit(1);
  }
};


seedDatabase();