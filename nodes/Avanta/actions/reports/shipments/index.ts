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
                resource: ['shipments'],
            },
        },
        options: [
            {
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update a shipment',
                action: 'Create or update a shipment',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many shipments',
                action: 'Get many shipments',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
