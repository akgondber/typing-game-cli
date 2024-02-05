import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fdir as Fdir} from 'fdir';
import random from 'just-random';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const won = 'WON';
const lost = 'LOST';

const sourcesPath = path.join(__dirname, 'sentences');
const isWon = value => value === won;
const isLost = value => value === lost;

const files = new Fdir()
	.filter((path, _isDirectory) => path.endsWith('.json'))
	.withFullPaths()
	.crawl(sourcesPath)
	.sync();

const getDefaultSuite = () => {
	return JSON.parse(fs.readFileSync(random(files), 'utf8'));
};

const getStatusVariant = status => {
	if (isWon(status)) return 'success';
	if (isLost(status)) return 'error';

	return '';
};

const getMessage = status => {
	if (isWon(status)) return 'You won!';
	if (isLost(status)) return 'Robot won!';

	return '';
};

const getBorderColor = status => {
	if (isWon(status)) return 'green';

	return '';
};

const getRobotBorderColor = status => {
	if (isLost(status)) return 'green';

	return '';
};

const getIntervalMs = level => {
	return {
		fast: 270,
		medium: 380,
		low: 1600,
	}[level];
};

const isFinished = status => [won, lost].includes(status);

export {
	getDefaultSuite,
	getStatusVariant,
	getMessage,
	getBorderColor,
	getRobotBorderColor,
	getIntervalMs,
	isFinished,
};
