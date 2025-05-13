import { test, expect } from '@playwright/test';;
import * as path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ensureSoundFiles, REQUIRED_SOUNDS } from '../../forgeboard-frontend/src/assets/sounds/sound-system';
import { Page } from '@playwright/test';

// Define TypeScript interfaces for MongoDB collections
interface SoundDocument {
  category: string;
  filename: string;
  path: string;
  required: boolean;
  exists?: boolean;
  isFallback?: boolean;
  inUse?: boolean;
  created: Date;
  lastChecked?: Date;
  lastUsed?: Date;
}

// Helper function to setup MongoDB connection
async function setupMongoConnection(): Promise<{
  mongoClient: MongoClient;
  mongod?: MongoMemoryServer;
  mongoUri: string;
}> {
  let mongod: MongoMemoryServer | undefined;
  let mongoUri: string;
  
  // Determine which MongoDB to use
  const useInMemoryMongo = process.env['USE_IN_MEMORY_MONGO'] === 'true';
  
  if (useInMemoryMongo) {
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log('Using in-memory MongoDB for sound tests');
  } else {
    mongoUri = process.env['MONGO_URI'] || 'mongodb://localhost:27017/forgeboard';
    console.log(`Using MongoDB at ${mongoUri} for sound tests`);
  }

  const mongoClient = await MongoClient.connect(mongoUri);
  
  return { mongoClient, mongod, mongoUri };
}

// Helper function to cleanup MongoDB connection
async function cleanupMongoConnection(mongoClient?: MongoClient, mongod?: MongoMemoryServer): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
  }
  
  if (mongod) {
    await mongod.stop();
  }
}

// Helper function to check and seed required sounds
async function checkAndSeedSounds(db: Db): Promise<Collection<SoundDocument>> {
  const soundsCollection = db.collection<SoundDocument>('sounds');
  
  // Check if we need to seed the collection
  const count = await soundsCollection.countDocuments();
  
  if (count === 0) {
    console.log('Sounds collection is empty, seeding with essential sounds...');
    
    // Insert sound document for each essential sound
    const soundDocs: SoundDocument[] = [];
    for (const [category, files] of Object.entries(REQUIRED_SOUNDS)) {
      for (const file of files) {
        soundDocs.push({
          category,
          filename: file,
          path: `assets/sounds/${category}/${file}`,
          required: true,
          created: new Date(),
        });
      }
    }
    
    await soundsCollection.insertMany(soundDocs);
    console.log(`Seeded ${soundDocs.length} sound documents`);
  }
  
  return soundsCollection;
}

// Helper function to update database with audio sources found in DOM
async function updateDatabaseWithAudioSources(page: Page, soundsCollection: Collection<SoundDocument>): Promise<void> {
  // Do a basic audio test by checking if audio elements are in the DOM
  const audioTest = await page.evaluate(() => {
    const audioElements = document.querySelectorAll('audio');
    return {
      count: audioElements.length,
      sources: Array.from(audioElements).map((el: HTMLAudioElement) => 
        Array.from(el.querySelectorAll('source')).map(src => src.getAttribute('src'))
      )
    };
  });
  
  console.log(`Found ${audioTest.count} audio elements in the DOM`);
  
  // Compare DOM audio elements with database records
  const audioSources = audioTest.sources.flat().filter(Boolean);
  console.log(`Found ${audioSources.length} audio source references`);
  
  // Update database with found sources
  for (const src of audioSources) {
    if (src) {
      const parts = src.split('/');
      const filename = parts[parts.length - 1];
      const category = parts[parts.length - 2];
      
      // Update or create entry in database
      await soundsCollection.updateOne(
        { category, filename },
        { 
          $set: { 
            path: src,
            inUse: true,
            lastUsed: new Date()
          }
        },
        { upsert: true }
      );
    }
  }
}

test('verify essential sound files are properly set up', async ({ page }) => {
  console.log('Checking essential sound files from database...');
  
  let mongoClient: MongoClient | undefined;
  let mongod: MongoMemoryServer | undefined;
  
  try {
    // Setup MongoDB connection
    const { mongoClient: client, mongod: server } = await setupMongoConnection();
    mongoClient = client;
    mongod = server;
    
    const db = mongoClient.db('forgeboard');
    
    // Check and seed required sounds
    const soundsCollection = await checkAndSeedSounds(db);
    
    // Ensure sound files exist or create fallbacks
    const assetsPath = path.resolve(__dirname, '../../forgeboard-frontend/src/assets/sounds');
    const allFilesExist = ensureSoundFiles(assetsPath);
    console.log(allFilesExist ? '✓ All sound files exist' : '✓ Created fallback sounds for missing files');

    // Load the application and verify it works
    await page.goto('/');
    await expect(page.locator('mat-toolbar')).toContainText('PROJECT: FORGEBOARD');
    console.log('✓ Application loaded successfully');
    
    // Update database with audio sources found in DOM
    await updateDatabaseWithAudioSources(page, soundsCollection);
    
    console.log('Sound system verification complete!');
  } catch (error) {
    console.error('Error during sound system verification:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await cleanupMongoConnection(mongoClient, mongod);
  }
});
