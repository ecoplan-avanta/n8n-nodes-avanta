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
                resource: ['creditmemos'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new credit memo, or update it if it already exists',
                action: 'Create or update a credit memo',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of credit memos',
                action: 'Retrieve a list of credit memos',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
