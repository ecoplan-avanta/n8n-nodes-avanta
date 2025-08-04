import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../../helpers/displayOptions';
import {getSearchFilters, executeGetAll} from "../../../helpers/utils";

const properties: INodeProperties[] = [
    {
        displayName: 'With Positions',
        name: 'withPositions',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['trackings'],
                operation: ['getAll'],
            },
        },
        default: false,
        description: 'Whether to include positions in the response',
    },
    ...getSearchFilters('trackings'),
];

const displayOptions = {
    show: {
        resource: ['trackings'],
        operation: ['getAll'],
    },
};

const restUrl = '/V1/proline-admin/reports/tracking';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    return executeGetAll.call(this, restUrl);
}