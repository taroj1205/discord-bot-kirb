import sqlite3 from 'sqlite3';
import fs from 'fs';

const dbPath = './database.sqlite';

// Create the file if it does not exist
fs.openSync(dbPath, 'a');

const db = new sqlite3.Database(dbPath);

function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS random_messages (
      server_id TEXT PRIMARY KEY,
      messages TEXT,
      chance FLOAT
    )`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function save(server_id: string, messages: string, chance: number): Promise<string> {
  await initializeDatabase();
  return await new Promise((resolve, reject) => {
    const stmt = db.prepare("INSERT OR REPLACE INTO random_messages VALUES (?, ?, ?)");
    stmt.run(server_id, messages, chance, function (this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`A row has been inserted or replaced with rowid ${this.lastID}`);
        resolve(`A row has been inserted or replaced with rowid ${this.lastID}`);
      }
    });
    stmt.finalize();
  });
}

export async function get(server_id: string): Promise<{ messages: string[], chance: number }> {
  await initializeDatabase();
  return await new Promise((resolve, reject) => {
    db.get("SELECT messages, chance FROM random_messages WHERE server_id = ?", [server_id], function (this: sqlite3.RunResult, err: Error | null, row: { messages: string; chance: number; }) {
      if (err) {
        console.error(err.message);
        reject(err);
      } else if (row) {
        const messages = row.messages.split(',');
        const chance = row.chance;
        resolve({ messages, chance });
      } else {
        resolve({ messages: ["L"], chance: 0.01 });
      }
    });
  });
}