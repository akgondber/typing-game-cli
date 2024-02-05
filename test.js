import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './source/app.js';

test('shows game name', t => {
	const {lastFrame} = render(<App />);

	t.true(lastFrame().includes('A'));
});

test('shows info', t => {
	const {lastFrame} = render(<App />);

	t.truthy(chalk);
	t.true(lastFrame().includes('A'));
});
