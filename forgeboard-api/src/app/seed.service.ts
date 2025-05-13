import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './models/user.model';
import { Log } from './models/log.model';
import { Metric } from './models/metric.model';
import { Diagnostic } from './models/diagnostic.model';
import { KanbanBoard } from './models/kanban.model';
import { Sound } from './models/sound.model';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(Metric.name) private metricModel: Model<Metric>,
    @InjectModel(Diagnostic.name) private diagnosticModel: Model<Diagnostic>,
    @InjectModel(KanbanBoard.name) private kanbanBoardModel: Model<KanbanBoard>,
    @InjectModel(Sound.name) private soundModel: Model<Sound>,
  ) {}

  async onModuleInit() {
    if (process.env.USE_IN_MEMORY_MONGO === 'true') {
      await this.seedUsers();
      await this.seedLogs();
      await this.seedMetrics();
      await this.seedDiagnostics();
      await this.seedKanbanBoards();
      await this.seedSounds();
      this.logger.log('In-memory MongoDB seeded with initial data.');
    }
  }

  private async seedUsers() {
    if ((await this.userModel.countDocuments()) === 0) {
      await this.userModel.create([
        { username: 'admin', password: 'admin', role: 'admin' },
        { username: 'user', password: 'user', role: 'user' },
      ]);
    }
  }

  private async seedLogs() {
    if ((await this.logModel.countDocuments()) === 0) {
      await this.logModel.create([
        { level: 'info', message: 'System started', timestamp: new Date(), source: 'system' },
        { level: 'error', message: 'Sample error', timestamp: new Date(), source: 'system' },
      ]);
    }
  }

  private async seedMetrics() {
    if ((await this.metricModel.countDocuments()) === 0) {
      await this.metricModel.create([
        { type: 'cpu', value: 0.5, timestamp: new Date(), cpu: 0.5 },
        { type: 'memory', value: 0.7, timestamp: new Date(), memory: 0.7 },
      ]);
    }
  }

  private async seedDiagnostics() {
    if ((await this.diagnosticModel.countDocuments()) === 0) {
      await this.diagnosticModel.create([
        { type: 'startup', eventType: 'info', timestamp: new Date(), source: 'system', message: 'Diagnostics started' },
      ]);
    }
  }
  
  private async seedKanbanBoards() {
    try {
      if ((await this.kanbanBoardModel.countDocuments()) === 0) {
        // Mock data from the frontend
        const mockData = [
          {
            "id": "board1",
            "name": "ForgeBoard Development",
            "columns": [
              {
                "id": "col1",
                "name": "To Do",
                "order": 1,
                "phase": "planning",
                "cards": [
                  {
                    "id": "card1",
                    "title": "Implement Authentication",
                    "description": "Set up JWT authentication for the API",
                    "priority": "high",
                    "tags": ["security", "api"],
                    "category": "security",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  },
                  {
                    "id": "card2",
                    "title": "Create Dashboard Layout",
                    "description": "Design and implement the main dashboard layout",
                    "priority": "medium",
                    "tags": ["ui", "frontend"],
                    "category": "user-experience",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  }
                ]
              },
              {
                "id": "col2",
                "name": "In Progress",
                "order": 2,
                "phase": "planning",
                "cards": [
                  {
                    "id": "card3",
                    "title": "Set up Metrics Service",
                    "description": "Create service for collecting and displaying system metrics",
                    "priority": "high",
                    "tags": ["backend", "metrics"],
                    "category": "infrastructure",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  }
                ]
              },
              {
                "id": "col3",
                "name": "Backlog",
                "order": 0,
                "phase": "planning",
                "cards": [
                  {
                    "id": "card4",
                    "title": "Optimize API Performance",
                    "description": "Identify and fix performance bottlenecks in the API",
                    "priority": "medium",
                    "tags": ["performance", "api"],
                    "category": "optimization",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  },
                  {
                    "id": "card5",
                    "title": "Write Documentation",
                    "description": "Create comprehensive documentation for the project",
                    "priority": "low",
                    "tags": ["docs"],
                    "category": "documentation",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  },
                  {
                    "id": "card6",
                    "title": "Implement WebSocket Connections",
                    "description": "Set up real-time data streaming with WebSockets",
                    "priority": "high",
                    "tags": ["realtime", "websockets"],
                    "category": "feature",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  }
                ]
              },
              {
                "id": "col4",
                "name": "Complete",
                "order": 3,
                "phase": "planning",
                "cards": [
                  {
                    "id": "card7",
                    "title": "Project Setup",
                    "description": "Initialize project structure and dependencies",
                    "priority": "high",
                    "tags": ["setup"],
                    "category": "project-management",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  },
                  {
                    "id": "card8",
                    "title": "CI/CD Pipeline",
                    "description": "Configure continuous integration and deployment",
                    "priority": "medium",
                    "tags": ["devops"],
                    "category": "infrastructure",
                    "createdAt": new Date().toISOString(),
                    "updatedAt": new Date().toISOString()
                  }
                ]
              }
            ],
            "currentPhase": "planning",
            "phases": {
              "inception": {
                "active": true,
                "startDate": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                "completionDate": new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
              },
              "planning": {
                "active": true,
                "startDate": new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
              },
              "design": {
                "active": false
              },
              "development": {
                "active": false
              },
              "testing": {
                "active": false
              },
              "completion": {
                "active": false
              }
            },
            "createdAt": new Date().toISOString(),
            "updatedAt": new Date().toISOString()
          }
        ];
        
        // Create the boards in the database
        await this.kanbanBoardModel.create(mockData);
        this.logger.log('Seeded Kanban boards');
      }
    } catch (error) {
      this.logger.error('Failed to seed Kanban boards:', error.message);
    }
  }

  private async seedSounds() {
    if ((await this.soundModel.countDocuments()) === 0) {
      try {
        // Define essential sounds
        const essentialSounds = {
          typewriter: ['key.mp3', 'ding.mp3'],
          // Add more categories as needed
        };

        // Create sound documents
        const soundDocs = [];
        
        for (const [category, files] of Object.entries(essentialSounds)) {
          for (const file of files) {
            soundDocs.push({
              category,
              filename: file,
              path: `assets/sounds/${category}/${file}`,
              required: true,
              exists: false, // Default to false until verified
              created: new Date(),
            });
          }
        }
        
        await this.soundModel.insertMany(soundDocs);
        this.logger.log(`Seeded ${soundDocs.length} sound documents`);
      } catch (error) {
        this.logger.error('Failed to seed sounds:', error.message);
      }
    }
  }
}
