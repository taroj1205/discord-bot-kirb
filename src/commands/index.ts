import * as ping from "./ping";
import * as github from "./github";
import * as kirb from "./kirb";
import * as dice from "./dice";
import * as messages from "./config/random-messages"
import * as leave from "./leave";

export const commands = {
  ping,
  github,
  kirb,
  dice,
  config: messages,
  leave,
};