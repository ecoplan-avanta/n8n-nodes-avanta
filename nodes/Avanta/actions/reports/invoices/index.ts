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
                resource: ['invoices'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new invoice, or update it if it already exists',
                action: 'Create or update an invoice',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of invoices',
                action: 'Retrieve a list of invoices',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
