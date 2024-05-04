import sqlite3 from "sqlite3";
import fs from "node:fs";

const dbPath = "./database.sqlite";

// Create the file if it does not exist
fs.openSync(dbPath, "a");

const db = new sqlite3.Database(dbPath);

function initializeDatabase(): Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			`CREATE TABLE IF NOT EXISTS random_messages (
      server_id TEXT PRIMARY KEY,
      messages TEXT,
      chance FLOAT,
      channel TEXT
    )`,
			(err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			},
		);
	});
}

export async function save(
	server_id: string,
	messages: string,
	chance: number,
): Promise<string> {
	await initializeDatabase();
	const messagesArray = JSON.stringify(
		messages.split(",").map((message) => message.trim()),
	);
	console.log(messagesArray);
	return await new Promise((resolve, reject) => {
		const stmt = db.prepare(
			"INSERT OR IGNORE INTO random_messages (server_id, messages, chance) VALUES (?, ?, ?)",
		);
		stmt.run(
			server_id,
			messagesArray,
			chance,
			function (this: sqlite3.RunResult, err: Error | null) {
				if (err) {
					console.error(err.message);
					reject(err);
				} else {
					const updateStmt = db.prepare(
						"UPDATE random_messages SET messages = ?, chance = ? WHERE server_id = ?",
					);
					updateStmt.run(
						messages,
						chance,
						server_id,
						function (this: sqlite3.RunResult, updateErr: Error | null) {
							if (updateErr) {
								console.error(updateErr.message);
								reject(updateErr);
							} else {
								console.log(
									`A row has been inserted or updated with rowid ${this.lastID}`,
								);
								resolve(
									`A row has been inserted or updated with rowid ${this.lastID}`,
								);
							}
						},
					);
					updateStmt.finalize();
				}
			},
		);
		stmt.finalize();
	});
}

export async function saveChannel(
	server_id: string,
	channel_id: string,
	action: string,
): Promise<string> {
	await initializeDatabase();
	return await new Promise((resolve, reject) => {
		db.get(
			"SELECT channel FROM random_messages WHERE server_id = ?",
			server_id,
			(err, row: { channel?: string }) => {
				if (err) {
					console.error(err.message);
					reject(err);
				} else if (row) {
					const channels: { [key: string]: boolean | null } = row.channel
						? JSON.parse(row.channel)
						: {};
					channels[channel_id] =
						action === "enable" ? true : action === "disable" ? false : null;

					const stmt = db.prepare(
						"UPDATE random_messages SET channel = ? WHERE server_id = ?",
					);
					stmt.run(
						JSON.stringify(channels),
						server_id,
						function (this: sqlite3.RunResult, err: Error | null) {
							if (err) {
								console.error(err.message);
								reject(err);
							} else {
								console.log(`A row has been updated with rowid ${this.lastID}`);
								resolve(`A row has been updated with rowid ${this.lastID}`);
							}
						},
					);
					stmt.finalize();
				} else {
					const stmt = db.prepare(
						"INSERT INTO random_messages (server_id, messages, chance, channel) VALUES (?, ?, ?, ?)",
					);
					stmt.run(
						server_id,
						"L",
						0.01,
						null,
						function (this: sqlite3.RunResult, err: Error | null) {
							if (err) {
								console.error(err.message);
								reject(err);
							} else {
								console.log(
									`A row has been inserted with rowid ${this.lastID}`,
								);
								resolve(`A row has been inserted with rowid ${this.lastID}`);
							}
						},
					);
					stmt.finalize();
				}
			},
		);
	});
}

export async function get(server_id: string): Promise<{
	messages: string[];
	chance: number;
	channels: { [key: string]: boolean | null } | null;
}> {
	await initializeDatabase();
	return await new Promise((resolve, reject) => {
		db.get(
			"SELECT messages, chance, channel FROM random_messages WHERE server_id = ?",
			[server_id],
			function (
				this: sqlite3.RunResult,
				err: Error | null,
				row: { messages: string; chance: number; channel: string | null },
			) {
				if (err) {
					console.error(err.message);
					reject(err);
				} else if (row) {
					const messages = row.messages
						.split(",")
						.map((message) => message.trim());
					const chance = row.chance;
					const channels: { [key: string]: boolean | null } = row?.channel
						? JSON.parse(row.channel)
						: {};
					resolve({ messages, chance, channels });
				} else {
					resolve({ messages: ["L"], chance: 1, channels: null });
				}
			},
		);
	});
}

const initializeNZDatabase = async () => {
	return new Promise<void>((resolve, reject) => {
		db.serialize(() => {
			db.run(
				"CREATE TABLE IF NOT EXISTS nz_users (server_id TEXT, user_id TEXT)",
				(err) => {
					if (err) {
						console.error(err.message);
						reject(err);
					} else {
						resolve();
					}
				},
			);
		});
	});
};

export async function addToNZ(server_id: string, user_id: string) {
	await initializeNZDatabase();
	return await new Promise((resolve, reject) => {
		const stmt = db.prepare(
			"INSERT OR IGNORE INTO nz_users (server_id, user_id) VALUES (?, ?)",
		);
		stmt.run(
			server_id,
			user_id,
			function (this: sqlite3.RunResult, err: Error | null) {
				if (err) {
					console.error(err.message);
					reject(err);
				} else {
					console.log(`A row has been inserted with rowid ${this.lastID}`);
					resolve(`A row has been inserted with rowid ${this.lastID}`);
				}
			},
		);
		stmt.finalize();
	});
}

export async function removeFromNZ(server_id: string, user_id: string) {
	await initializeNZDatabase();
	return await new Promise((resolve, reject) => {
		const stmt = db.prepare(
			"DELETE FROM nz_users WHERE server_id = ? AND user_id = ?",
		);
		stmt.run(
			server_id,
			user_id,
			function (this: sqlite3.RunResult, err: Error | null) {
				if (err) {
					console.error(err.message);
					reject(err);
				} else {
					console.log(`A row has been deleted with rowid ${this.lastID}`);
					resolve(`A row has been deleted with rowid ${this.lastID}`);
				}
			},
		);
		stmt.finalize();
	});
}

export async function getNZ(server_id: string): Promise<string[]> {
	await initializeNZDatabase();
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT user_id FROM nz_users WHERE server_id = ?",
			[server_id],
			(err: Error | null, rows: { user_id: string }[]) => {
				if (err) {
					console.error(err.message);
					reject(err);
				} else {
					const userIds = rows.map((row) => row.user_id);
					resolve(userIds);
				}
			},
		);
	});
}

initializeDatabase();
initializeNZDatabase();
