import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fdir as Fdir} from 'fdir';
import random from 'just-random';
import sortBy from 'just-sort-by';
import {parseISO} from 'date-fns';
import Config from './config.js';

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

const getWpmTextColor = (wpm, otherWpm) => {
	if (wpm > otherWpm) return 'green';
	if (otherWpm > wpm) return 'red';
	return 'gray';
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
		extraFast: 200,
		fast: 260,
		medium: 360,
		low: 1600,
	}[level];
};

const isFinished = status => [won, lost].includes(status);
const isWordTyped = (source, outgoing) =>
	source.length === outgoing.length ||
	source.slice(outgoing.length, outgoing.length + 1) === ' ';
const calculateWPM = (wordCount, startTime, finishTime, finished = false) => {
	const durInMinutes = (finishTime - startTime) / 60_000;

	return finished || durInMinutes > 1
		? Math.round(wordCount / durInMinutes)
		: wordCount;
};

const getTypingWord = (source, typed, hasErroredPart) => {
	const incoming = source.slice(typed.length);
	const nextSpaceIndex = incoming.indexOf(' ', 1);

	if (
		source.slice(typed.length, typed.length + 1) === ' ' ||
		nextSpaceIndex === -1
	)
		return '';

	const result = incoming.slice(0, nextSpaceIndex);
	return hasErroredPart ? result.slice(1) : result;
};

const getRemainingPart = (source, typed, hasErroredPart = false) => {
	const word = getTypingWord(source, typed, hasErroredPart);
	let increment = word.length;

	if (hasErroredPart) {
		increment += 1;
	}

	return source.slice(typed.length + increment);
};

const getResults = ({sortBy: sortByValue = '-wpm'}) => {
	const config = new Config();
	const data = config.get();

	// eslint-disable-next-line unicorn/no-array-reduce
	const statistics = Object.keys(data).reduce((memo, item) => {
		return [...memo, {date: item, value: data[item]}];
	}, []);
	const result = sortBy(statistics, item => {
		if (sortByValue === 'wpm') {
			return item.value;
		}

		if (sortByValue === '-wpm') {
			return -item.value;
		}

		if (sortByValue === 'date') {
			return parseISO(item.date);
		}

		return -parseISO(item.date);
	});

	return result;
};

const getSortedByString = value => {
	if (value.startsWith('-')) {
		return `${value.slice(1)} desc`;
	}

	return value;
};

export {
	getDefaultSuite,
	getStatusVariant,
	getWpmTextColor,
	getMessage,
	getBorderColor,
	getRobotBorderColor,
	getIntervalMs,
	isFinished,
	isWordTyped,
	calculateWPM,
	getTypingWord,
	getRemainingPart,
	getResults,
	getSortedByString,
};
