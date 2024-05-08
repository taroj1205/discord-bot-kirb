import fs from "node:fs"
import path from "node:path"

export const createLogFilePath = (year: number, month: number) => {
  const dir = path.join(__dirname, `../../logs/${year}/${month}`)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  return dir
}

export const saveLog = (message: string, error?: boolean) => {
  const now = new Date()
  const date = now.toISOString().split("T")[0]
  const year = now.getFullYear()
  const month = now.getMonth()
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")
  const logDir = path.join(createLogFilePath(year, month), `${date}.log`)
  fs.appendFile(
    logDir,
    `${hours}:${minutes}:${seconds} ${error ? "ERROR: " : ""}${message}\n`,
    (err) => {
      if (err) {
        console.log(err)
      }
    },
  )
}
