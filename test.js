import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import {fdir as Fdir} from 'fdir';
import App from './source/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcesPath = path.join(__dirname, 'source', 'sentences');

const files = new Fdir()
	.filter((path, _isDirectory) => path.endsWith('.json'))
	.withFullPaths()
	.crawl(sourcesPath)
	.sync();

test('shows game name', t => {
	const {lastFrame} = render(<App />);

	t.true(lastFrame().includes('A'));
});

test('shows info', t => {
	const {lastFrame} = render(<App />);

	t.truthy(chalk);
	t.true(lastFrame().includes('A'));
});

test('should not have sentences less than 330 chars', t => {
	const items = [];
	for (const file of files)
		for (const sentence of JSON.parse(fs.readFileSync(file, 'utf8'))
			.sentences) {
			if (sentence.length < 330) {
				items.push(file);
			}
		}

	t.is(items.length, 0);
});

test('should not have sentences starting or ending with spaces', t => {
	const items = [];
	for (const file of files)
		for (const sentence of JSON.parse(fs.readFileSync(file, 'utf8'))
			.sentences) {
			if (sentence.startsWith(' ') || sentence.endsWith(' ')) {
				items.push({file, sentence});
			}
		}

	// eslint-disable-next-line ava/assertion-arguments
	t.is(
		items.length,
		0,
		items
			.map(item => `File: ${item.file}; sentence: ${item.sentence}`)
			.join('\n'),
	);
});
