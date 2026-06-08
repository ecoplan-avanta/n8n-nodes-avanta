import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';

export {create,getAll};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['companyAddress'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company address, or update it if it already exists',
				action: 'Create or update a company address',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company address',
				action: 'Delete a company address',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of company addresses',
				action: 'Retrieve a list of company addresses',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
];
