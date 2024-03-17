import React from 'react';
import {Text, Box} from 'ink';
import {optionKeyColor} from './constants.js';

export default function Menu() {
	return (
		<Box flexDirection="column">
			<Box paddingY={1} columnGap={1}>
				<Text>
					{' '}
					<Text bold color={optionKeyColor}>
						y
					</Text>{' '}
					- start a new round
				</Text>
				<Text>
					<Text bold color={optionKeyColor}>
						r
					</Text>{' '}
					- display results
				</Text>
			</Box>
		</Box>
	);
}
