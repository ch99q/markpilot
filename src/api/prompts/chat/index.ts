import { FewShotPrompt } from '..';
import example1Assistant from './example1/assistant.md';
import example1User from './example1/user.md';
import example2Assistant from './example2/assistant.md';
import example2User from './example2/user.md';
import system from './system.txt';

export const CHAT_PROMPT: FewShotPrompt = {
	system,
	examples: [
		{
			user: example1User,
			assistant: example1Assistant,
		},
		{
			user: example2User,
			assistant: example2Assistant,
		},
	],
};
