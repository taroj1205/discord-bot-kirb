import * as ping from "./ping";
import * as github from "./github";
import * as kirb from "./kirb";
import * as dice from "./dice";
import * as messages from "./config/random-messages";
import * as leave from "./leave";
import * as invite from "./invite";
import * as common from "./common";
import * as timestamp from "./timestamp";
import * as nz from "./new-zealand";

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
};
