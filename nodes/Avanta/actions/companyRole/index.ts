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
				name: 'Create/Update',
				value: 'create',
				description: '(avanta v3.6) Create or update a company role',
				action: '(avanta v3.6) Create or update a company role',
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
				description: 'Get many company roles',
				action: 'Get many company roles',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
