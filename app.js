const ngrok = require("@ngrok/ngrok");
const path = require("path");
const fs = require("fs");
const { Octokit } = require("@octokit/rest");
const sodium = require("sodium-native");
require("dotenv").config();
const http = require("http");
const { exec } = require("child_process");


const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const authToken = String(process.env.NGROK_AUTHTOKEN);

(async function () {
	await ngrok.authtoken(authToken);
	const listener = await ngrok.forward({ addr: 8080 });

	console.log(`Listening to: ${listener.url()}/restart`);

	const {
		data: { key, key_id },
	} = await octokit.rest.actions.getRepoPublicKey({
		owner: "taroj1205",
		repo: "discord-bot-kirb",
	});

	// Convert the public key and the message into Buffer
	let publicKey = Buffer.from(key, "base64");
	let message = Buffer.from(listener.url());

	// Create a buffer with the right size for the encrypted message
	let encrypted = Buffer.alloc(message.length + sodium.crypto_box_SEALBYTES);

	// Encrypt the message
	sodium.crypto_box_seal(encrypted, message, publicKey);

	// Update the GitHub secret
	await octokit.rest.actions.createOrUpdateRepoSecret({
		owner: "taroj1205",
		repo: "discord-bot-kirb",
		secret_name: "DISCORD_WEBHOOK_URL",
		encrypted_value: encrypted.toString("base64"),
		key_id: key_id,
	});

	restartBot()

	const server = http.createServer(async (req, res) => {
		if (req.url === "/restart" && req.method === "GET") {
			try {
				await restartBot();
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end("Bot restarted successfully");
			} catch (error) {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end("Failed to restart bot");
			}
		} else {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Invalid command");
		}
	});

	server.listen(8080, () => {
		console.log("Server listening on port 8080");
	});
})();

let botProcess = null;

async function restartBot() {
	try {
		console.log("Restarting bot...");
		const botDirPath = path.join(__dirname, "../discord-bot-kirb");

		// Create a timestamp for the log file
		const timestamp = new Date().toISOString().replace(/:/g, '-').replace('T', '-').substring(0, 19);
		const logFilePath = path.join(__dirname, `./logs/${timestamp}.log`);

		// Create log folder if not exists
		if (!fs.existsSync(path.dirname(logFilePath))) {
			fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
		}

		// Stop the current bot if it's running
		if (botProcess) {
			botProcess.kill();
			botProcess = null;
			console.log("Bot process stopped.");
		}

		// Check if the directory exists
		if (!fs.existsSync(botDirPath)) {
			// Clone the repository if it doesn't exist
			botProcess = exec(`git clone https://github.com/taroj1205/discord-bot-kirb.git && cd ${botDirPath} && pnpm i && pnpm build && pnpm run start > ${logFilePath} 2>&1`, { cwd: path.dirname(botDirPath) });
		} else {
			// Pull the latest changes if the repository already exists
			botProcess = exec(`git pull && cd ${botDirPath} && pnpm i && pnpm build && pnpm run start > ${logFilePath} 2>&1`, { cwd: botDirPath });
		}

		console.log("Bot restarted successfully.");
	} catch (error) {
		console.error("Failed to restart bot:", error);
	}
}