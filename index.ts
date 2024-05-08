import ngrok from "@ngrok/ngrok";
import { Octokit } from "@octokit/rest";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { randomBytes, createCipheriv } from "crypto";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ngrokAuthToken = String(process.env.NGROK_AUTHTOKEN);

async function getPublicKey() {
	const {
		data: { key, key_id },
	} = await octokit.rest.actions.getRepoPublicKey({
		owner: "taroj1205",
		repo: "discord-bot-kirb",
	});
	return { key, key_id };
}

async function encryptMessage(message: Buffer, publicKey: Buffer) {
	const algorithm = "aes-256-ctr";
	const iv = randomBytes(16);
	const cipher = createCipheriv(algorithm, publicKey.subarray(0, 32), iv);
	const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
	return Buffer.concat([iv, encrypted]);
}

async function updateGithubSecret(encrypted: Buffer, key_id: string) {
	await octokit.rest.actions.createOrUpdateRepoSecret({
		owner: "taroj1205",
		repo: "discord-bot-kirb",
		secret_name: "DISCORD_WEBHOOK_URL",
		encrypted_value: encrypted.toString("base64"),
		key_id: key_id,
	});
}

async function createServer() {
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
}
async function main() {
	console.log("Starting bot...");
	try {
		console.log(ngrokAuthToken)
		const listener = await ngrok.forward({ addr: 8080, authtoken: ngrokAuthToken });
		console.log(listener)

		if (!listener || !listener.url()) {
			throw new Error("Failed to start listener");
		}
		console.log(`Listening to: ${listener.url()}/restart`);

		const { key, key_id } = await getPublicKey();
		const publicKey = Buffer.from(key, "base64");
		const url = listener.url();
		if (!url) {
			throw new Error("URL is null");
		}
		const message = Buffer.from(url);
		const encrypted = await encryptMessage(message, publicKey);
		await updateGithubSecret(encrypted, key_id);

		restartBot();
		createServer();
	} catch (error) {
		console.error("Failed to start bot:", error);
	}
}

main();

async function restartBot() {
	try {
		console.log("Restarting bot...");
		const logFilePath = createLogFilePath();

		if (!fs.existsSync(path.dirname(logFilePath))) {
			fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
		}

		console.log("Bot restarted successfully.");
	} catch (error) {
		console.error("Failed to restart bot:", error);
	}
}

function createLogFilePath() {
	const now = new Date();
	const date = now.toISOString().split("T")[0];
	const hours = now.getHours().toString().padStart(2, "0");
	const minutes = now.getMinutes().toString().padStart(2, "0");
	const seconds = now.getSeconds().toString().padStart(2, "0");
	const timestamp = `${hours}_${minutes}_${seconds}`;
	return path.join(__dirname, `./logs/${date}/${timestamp}.log`);
}
