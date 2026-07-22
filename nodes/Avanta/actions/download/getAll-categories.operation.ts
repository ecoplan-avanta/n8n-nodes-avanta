import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {executeGetAll} from '../../helpers/utils';

export const description: INodeProperties[] = [
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['getAllCategories'],
            },
        },
        default: false,
        description: 'Whether to return all results or only up to a given limit',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['getAllCategories'],
                returnAll: [false],
            },
        },
        typeOptions: {minValue: 1},
        default: 50,
        description: 'Max number of results to return',
    },
    {
        displayName: 'Filter',
        name: 'filterType',
        type: 'options',
        options: [
            {name: 'None', value: 'none'},
            {name: 'JSON', value: 'json'},
        ],
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['getAllCategories'],
            },
        },
        default: 'none',
    },
    {
        displayName: 'See <a href="https://devdocs.magento.com/guides/v2.4/rest/performing-searches.html" target="_blank">Magento guide</a> to creating filters',
        name: 'jsonNotice',
        type: 'notice',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['getAllCategories'],
                filterType: ['json'],
            },
        },
        default: '',
    },
    {
        displayName: 'Filters (JSON)',
        name: 'filterJson',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['getAllCategories'],
                filterType: ['json'],
            },
        },
        default: '',
    },
];

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    return executeGetAll.call(this, '/V1/proline-admin/download/category/search');
}
