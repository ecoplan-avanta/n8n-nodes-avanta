import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as remove from './remove.operation';

export {create, remove};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['companyRestrict'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company restriction, or update it if it already exists',
				action: 'Create or update a company restriction',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company restriction',
				action: 'Delete a company restriction',
			}
		],
		default: 'create',
	},
	...create.description,
	...remove.description
];