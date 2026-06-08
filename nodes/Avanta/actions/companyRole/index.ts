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
				resource: ['companyRole'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company role, or update it if it already exists (available from avanta v3.6)',
				action: 'Create or update a company role',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete a company role',
				action: 'Delete a company role',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of company roles',
				action: 'Retrieve a list of company roles',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
