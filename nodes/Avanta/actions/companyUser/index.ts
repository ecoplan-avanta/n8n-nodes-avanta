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
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a company user',
				action: 'Create or update a company user',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company user',
				action: 'Delete a company user',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a company user',
				action: 'Get a company user',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many company users',
				action: 'Get many company users',
			},
		],
		default: 'create',
	},
	...create.description,
];
