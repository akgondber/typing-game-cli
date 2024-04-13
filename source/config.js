import fs from 'node:fs';
import os from 'node:os';
import {join} from 'node:path';

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

		fs.writeFileSync(this._configFile, data, 'utf8');
	}

	clearAll() {
		fs.writeFileSync(this._configFile, '{}', 'utf8');
	}
}

export const config = new Config();
