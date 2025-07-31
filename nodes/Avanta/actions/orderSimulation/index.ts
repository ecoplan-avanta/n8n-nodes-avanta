import type {INodeProperties} from 'n8n-workflow';

import * as execute from './execute.operation';

export {execute};

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
            },
        },
        options: [
            {
                name: 'Execute',
                value: 'execute',
                description: 'Execute order simulation',
                action: 'Execute order simulation',
            }
        ],
        default: 'execute',
    },
    ...execute.description,
];
