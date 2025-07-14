import { Database } from "../helper/Database";

export class InitDb {
  constructor(private database: Database) {}

  async initialize(): Promise<void> {
    try {
      await this.createTables();
      await this.insertInitialData();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Create city table - INSEE as primary key (PDF requirement)
    await this.database.run(`
      CREATE TABLE IF NOT EXISTS city (
        insee TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        zipcode TEXT NOT NULL,
        population INTEGER NOT NULL
      )
    `);

    // Create forecast table - with JSON details (PDF requirement)
    await this.database.run(`
      CREATE TABLE IF NOT EXISTS forecast (
        insee TEXT NOT NULL,
        date TEXT NOT NULL,
        details TEXT NOT NULL,
        PRIMARY KEY (insee, date),
        FOREIGN KEY (insee) REFERENCES city (insee) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables created successfully');
  }

  private async insertInitialData(): Promise<void> {
    // Check if cities already exist
    const existingCities = await this.database.get('SELECT COUNT(*) as count FROM city');
    
    if (existingCities.count > 0) {
      console.log('ℹ️  Cities already exist, skipping initial data insertion');
      return;
    }

    // Insert French cities as per PDF requirements
    const cities = [
      { insee: '75101', name: 'Paris 1er Arrondissement', zipcode: '75001', population: 16888 },
      { insee: '75102', name: 'Paris 2e Arrondissement', zipcode: '75002', population: 22169 },
      { insee: '75103', name: 'Paris 3e Arrondissement', zipcode: '75003', population: 34248 },
      { insee: '69123', name: 'Lyon', zipcode: '69000', population: 515695 },
      { insee: '13055', name: 'Marseille', zipcode: '13000', population: 861635 },
      { insee: '31555', name: 'Toulouse', zipcode: '31000', population: 479553 },
      { insee: '06088', name: 'Nice', zipcode: '06000', population: 343629 },
      { insee: '44109', name: 'Nantes', zipcode: '44000', population: 309346 },
      { insee: '67482', name: 'Strasbourg', zipcode: '67000', population: 280966 },
      { insee: '34172', name: 'Montpellier', zipcode: '34000', population: 285121 }
    ];

    // Insert cities
    for (const city of cities) {
      await this.database.run(
        'INSERT INTO city (insee, name, zipcode, population) VALUES (?, ?, ?, ?)',
        [city.insee, city.name, city.zipcode, city.population]
      );
    }

    console.log(`✅ Inserted ${cities.length} initial cities`);
  }
}
