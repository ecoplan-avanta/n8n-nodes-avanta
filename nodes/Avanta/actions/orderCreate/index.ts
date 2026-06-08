import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';

export {create};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['orderCreate'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'orderCreate',
				description: 'Create a new order',
				action: 'Create an order',
			}
		],
		default: 'orderCreate',
	},
	...create.description,
];
