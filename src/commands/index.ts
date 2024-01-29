import * as ping from "./ping";
import * as repos from "./repos";
import * as github from "./github";
import * as kirb from "./kirb";
import * as dice from "./dice";

export const commands = {
  ping,
  getrepos: repos,
  github,
  kirb,
  dice,
};