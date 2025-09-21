import React, {useState} from 'react';
import {Text, useInput} from 'ink';

export default function QuestionPrompt() {
	const [showApp, setShowApp] = useState(false);

	useInput((input, _key) => {
		if (input === 'y') {
			setShowApp(true);
		}
	});

	return showApp ? <Text>UIE</Text> : <Text>OTHE</Text>;
}
