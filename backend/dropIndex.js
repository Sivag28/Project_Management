import mongoose from 'mongoose';
import Channel from './models/Channel.js';
import dotenv from 'dotenv';

dotenv.config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop the unique index on name if it exists
    const collection = mongoose.connection.db.collection('channels');
    const indexes = await collection.indexes();
    const nameIndex = indexes.find(index => index.name === 'name_1' || index.key.name === 1);

    if (nameIndex) {
      await collection.dropIndex('name_1');
      console.log('Dropped unique index on name');
    } else {
      console.log('No unique index on name found');
    }

    console.log('Index check complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
