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
                resource: ['orders'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new order report, or update it if it already exists',
                action: 'Create or update an order report',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of order reports',
                action: 'Retrieve a list of order reports',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
