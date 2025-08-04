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
                resource: ['trackings'],
            },
        },
        options: [
            {
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update a tracking',
                action: 'Create or update a tracking',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many trackings',
                action: 'Get many trackings',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
