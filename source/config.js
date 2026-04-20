import fs from 'node:fs';
import os from 'node:os';
import {join} from 'node:path';
import {formatISO} from 'date-fns';

const defaultConfig = {};

export default class Config {
	constructor() {
		this._configFile = join(os.homedir(), '.typing-game-cli.json');

		this._ensureConfigFile();
	}

	_ensureConfigFile() {
		if (fs.existsSync(this._configFile)) {
			return;
		}

		const data = JSON.stringify(defaultConfig, null, 4);
		fs.writeFileSync(this._configFile, data, 'utf8');
	}

	get() {
		let config = {};

		const content = fs.readFileSync(this._configFile, 'utf8');
		config = JSON.parse(content);

		return {...defaultConfig, ...config};
	}

	addEntry(entry) {
		const previous = this.get();
		const data = JSON.stringify({...previous, ...entry}, null, 4);

		this.persist(data);
	}

	appendGoal(wpm) {
		const previous = this.get();
		const currentGoals = previous.goals || [];
		currentGoals.push({wpm, date: formatISO(new Date())});
		const data = JSON.stringify(
			{...previous, goals: currentGoals, goal: wpm},
			null,
			4,
		);

		this.persist(data);
	}

	clearAll() {
		this.persist('{}');
	}

	persist(data) {
		fs.writeFileSync(this._configFile, data, 'utf8');
	}
}

export const config = new Config();
