import test from 'ava';
import * as helpers from '../source/helpers.js';

test('returns appropriate variant', t => {
	t.is(helpers.getStatusVariant('WON'), 'success');
	t.is(helpers.getStatusVariant('LOST'), 'error');
});

test('returns appropriate message when competing against best result', t => {
	t.is(
		helpers.getMessage('WON', {againstMyself: true}),
		'You have surpassed your best score!',
	);
	t.is(
		helpers.getMessage('LOST', {againstMyself: true}),
		'You were unable to beat your best result.',
	);
});

test('returns appropriate message when competing against robot', t => {
	t.is(helpers.getMessage('WON', {againstMyself: false}), 'You won!');
	t.is(helpers.getMessage('LOST', {againstMyself: false}), 'Robot won!');
});

test('returns appropriate intervalMs', t => {
	t.is(helpers.getIntervalMs('extraFast'), 200);
	t.is(helpers.getIntervalMs('fast'), 260);
	t.is(helpers.getIntervalMs('medium'), 360);
	t.is(helpers.getIntervalMs('low'), 1600);
});
