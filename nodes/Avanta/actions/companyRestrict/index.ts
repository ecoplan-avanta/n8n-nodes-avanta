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
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a company restrict',
				action: 'Create or update a company restrict',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company restrict',
				action: 'Delete a company restrict',
			}
		],
		default: 'create',
	},
	...create.description,
	...remove.description
];