import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as remove from './remove.operation';
import * as getAll from './getAll.operation';

export {create,getAll,remove};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['salesOrg'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new sales organization, or update it if it already exists',
				action: 'Create or update a sales organization',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete a sales organization',
				action: 'Delete a sales organization',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of sales organizations',
				action: 'Retrieve a list of sales organizations',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
