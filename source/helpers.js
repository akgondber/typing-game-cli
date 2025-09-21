import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fdir as Fdir} from 'fdir';
import random from 'just-random';
import compose from 'just-compose';
import sortBy from 'just-sort-by';
import {format, formatISO, isValid, parseISO} from 'date-fns';
import Config from './config.js';
import {frames} from './robotFrames.js';
import {defaultHandicapCount, numerics} from './constants.js';

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

const getFilesByTopic = topic => {
	return new Fdir()
		.filter((path, _isDirectory) => path.endsWith('.json'))
		.withFullPaths()
		.crawl(path.join(sourcesPath, topic))
		.sync();
};

const readFile = file => fs.readFileSync(file, 'utf8');

const getSuiteByTopic = topic => {
	return compose(getFilesByTopic, random, readFile, JSON.parse)(topic);
};

const getDefaultSuite = () => {
	return JSON.parse(fs.readFileSync(random(files), 'utf8'));
};

const getStatusVariant = status => {
	if (isWon(status)) return 'success';
	if (isLost(status)) return 'error';

	return '';
};

const getSentencesSkippingWords = (sentences, wordCountToSkip) => {
	if (wordCountToSkip > 0) {
		let previousSpace = false;
		let sliceStart = 0;
		let counter = 0;
		let i = 0;

		for (const ch of sentences) {
			if (ch === ' ') {
				if (previousSpace) {
					sliceStart = i;
				} else {
					sliceStart = i;
					previousSpace = true;
					counter++;
				}
			} else {
				previousSpace &&= false;

				if (wordCountToSkip === counter) {
					sliceStart = i;
					break;
				}
			}

			i++;
		}

		return sentences.slice(sliceStart);
	}

	return sentences;
};

const getHaLeft = (sentences, wordCountToSkip) => {
	if (wordCountToSkip > 0) {
		let previousSpace = false;
		let sliceStart = 0;
		let counter = 0;
		let i = 0;

		for (const ch of sentences) {
			if (ch === ' ') {
				if (previousSpace) {
					sliceStart = i;
				} else {
					sliceStart = i;
					previousSpace = true;
					counter++;
				}
			} else {
				previousSpace &&= false;

				if (wordCountToSkip === counter) {
					sliceStart = i;
					break;
				}
			}

			i++;
		}

		return sentences.slice(0, sliceStart > 0 ? sliceStart : 56);
	}

	return '';
};

const getHaCount = (value, inputValue) => {
	if (inputValue !== undefined && inputValue !== '') {
		return Number(inputValue);
	}

	if (value === undefined || value === null) {
		return defaultHandicapCount;
	}

	return value;
};

const getWpmTextColor = (wpm, otherWpm) => {
	if (wpm > otherWpm) return 'green';
	if (otherWpm > wpm) return 'red';
	return 'gray';
};

const getScoreTextColor = (score, otherScore) => {
	if (score > otherScore) return 'green';
	if (otherScore > score) return 'red';
	return 'gray';
};

const getMessage = (status, {againstMyself = false}) => {
	if (againstMyself) {
		if (isWon(status)) return 'You have surpassed your best score!';
		if (isLost(status)) return 'You were unable to beat your best result.';
		return 'Your current score is equivalent to your best score.';
	}

	if (isWon(status)) return 'You won!';
	if (isLost(status)) return 'Robot won!';

	return 'Tie.';
};

const getMessageOrPlaceholder = (
	status,
	{againstMyself = false, asPlaceholder = false},
) => {
	const message = getMessage(status, {againstMyself});
	return asPlaceholder ? message.replaceAll(/./g, ' ') : message;
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

const getWordCount = sentence => {
	return sentence.split(' ').filter(Boolean).length;
};

const isFinished = status => [won, lost].includes(status);
const isWordTyped = (source, outgoing) =>
	source.length === outgoing.length ||
	source.slice(outgoing.length, outgoing.length + 1) === ' ';
const isLastNumber = value => {
	return numerics.includes(value.slice(-1));
};

const isAboutToFinish = (source, value) => {
	return source === value;
};

const calculateWPM = (wordCount, startTime, finishTime, finished = false) => {
	const durInMinutes = (finishTime - startTime) / 60_000;

	return finished || durInMinutes > 1
		? Math.round(wordCount / durInMinutes)
		: wordCount;
};

const calculateCPS = (charCount, startTime, finishTime) => {
	const durInSeconds = (finishTime - startTime) / 1000;

	return durInSeconds > 1 ? Math.round(charCount / durInSeconds) : charCount;
};

const calculateCPM = (charCount, startTime, finishTime) => {
	const durInMinutes = (finishTime - startTime) / 60_000;

	return durInMinutes >= 1 ? Math.round(charCount / durInMinutes) : charCount;
};

const getCompetitionResult = (userText, robotText) => {
	if (userText.length > robotText.length) return 'WON';
	if (userText.length < robotText.length) return 'LOST';
	return 'TIE';
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

const getResults = ({sortBy: sortByValue = '-wpm', showAll = false, topN}) => {
	const config = new Config();
	const data = config.get();

	// eslint-disable-next-line unicorn/no-array-reduce
	const statistics = Object.keys(data).reduce((memo, item) => {
		return isValid(parseISO(item)) && data[item].passedSeconds >= 60
			? [...memo, {date: item, value: data[item]}]
			: memo;
	}, []);
	const result = sortBy(statistics, item => {
		if (sortByValue === 'cpm') {
			return item.value.cpm;
		}

		if (sortByValue === '-cpm') {
			return -item.value.cpm;
		}

		if (sortByValue === 'wpm') {
			return item.value.wpm;
		}

		if (sortByValue === '-wpm') {
			return -item.value.wpm;
		}

		if (sortByValue === 'date') {
			return parseISO(item.date);
		}

		return -parseISO(item.date);
	});

	if (!showAll) {
		return result.slice(0, topN === undefined ? 10 : topN);
	}

	return result;
};

const getBestResult = () => {
	const config = new Config();
	const data = config.get();

	// eslint-disable-next-line unicorn/no-array-reduce
	const statistics = Object.keys(data).reduce((memo, item) => {
		return isValid(parseISO(item))
			? [...memo, {date: item, value: data[item]}]
			: memo;
	}, []);
	const targetItems = statistics.filter(item => item.value.passedSeconds >= 60);

	if (targetItems.length === 0) return null;
	return sortBy(targetItems, item => -item.value.cpm)[0];
};

const getBestResultCompactString = () => {
	const result = getBestResult();
	if (!result) {
		return 'There is no data, please run some rounds to collect stats.';
	}

	return `Date: ${format(parseISO(result.date), 'MM/dd/yyyy HH:mm')}; wpm: ${result.value.wpm}; cpm: ${result.value.cpm}.`;
};

const getResultByWordCount = ({wordCount}) => {
	const sortedByWpmResults = getResults({sortBy: '-wpm', showAll: true});
	return sortedByWpmResults.find(result => result.wordCount === wordCount);
};

const getBestWpmResult = () => {
	return getResults({sortBy: '-wpm'})[0];
};

const getBestFrames = () => {
	const config = new Config();
	const data = config.get();

	return data.bestFrames;
};

const getOpponentFrames = ({
	usingBestResult = false,
	robotLevel = 'medium',
}) => {
	if (usingBestResult) {
		return getBestFrames();
	}

	return frames[robotLevel];
};

const getSortedByString = value => {
	if (value.startsWith('-')) {
		return `${value.slice(1)} (desc)`;
	}

	return value;
};

const registerResult = (config, date, resultObject) => {
	config.addEntry({[formatISO(date)]: resultObject});
};

const registerBestFrames = (config, frames) => {
	config.addEntry({bestFrames: frames});
};

export {
	getDefaultSuite,
	getStatusVariant,
	getSentencesSkippingWords,
	getHaLeft,
	getHaCount,
	getWpmTextColor,
	getScoreTextColor,
	getMessage,
	getMessageOrPlaceholder,
	getBorderColor,
	getRobotBorderColor,
	getIntervalMs,
	isFinished,
	isWordTyped,
	isLastNumber as isLastNum,
	isAboutToFinish,
	calculateWPM,
	calculateCPS,
	calculateCPM,
	getCompetitionResult,
	getTypingWord,
	getRemainingPart,
	getResults,
	getBestResult,
	getBestResultCompactString,
	getBestFrames,
	getOpponentFrames,
	getResultByWordCount,
	getBestWpmResult,
	getSortedByString,
	getWordCount,
	getSuiteByTopic,
	registerResult,
	registerBestFrames,
};
