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
				resource: ['companyUser'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company user, or update it if it already exists',
				action: 'Create or update a company user',
			}
		],
		default: 'create',
	},
	...create.description,
];
