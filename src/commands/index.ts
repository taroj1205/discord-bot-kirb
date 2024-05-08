import * as common from "./common"
import * as messages from "./config/random-messages"
import * as dice from "./dice"
import * as github from "./github"
import * as invite from "./invite"
import * as kirb from "./kirb"
import * as leave from "./leave"
import * as nz from "./new-zealand"
import * as ping from "./ping"
import * as timestamp from "./timestamp"

export const commands = {
  ping,
  github,
  kirb,
  dice,
  config: messages,
  leave,
  invite,
  common,
  timestamp,
  nz,
}
