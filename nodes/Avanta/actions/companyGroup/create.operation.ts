import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import type { CompanyGroup } from '../../transport';
import { prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyGroup'],
                operation: ['create'],
            },
        },
        description: 'Name of the company group',
    },
    {
        displayName: 'Store Group Name or ID',
        name: 'store_group_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        required: true,
        displayOptions: {
            show: {
                resource: ['companyGroup'],
                operation: ['create'],
            },
        },
        default: ''
    },
    {
        displayName: 'External ID',
        name: 'external_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyGroup'],
                operation: ['create'],
            },
        },
        description: 'External ID of the company group',
    },
];

const displayOptions = {
    show: {
        resource: ['companyGroup'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/companygroup';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { companyGroup: CompanyGroup }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const name = this.getNodeParameter('name', i) as string;
            const store_group_id = this.getNodeParameter('store_group_id', i) as string;
            const external_id = this.getNodeParameter('external_id', i) as string;

            const companyGroup = {
                companyGroup: {
                    name,
                    store_group_id: store_group_id ? parseInt(store_group_id, 10) : undefined,
                    external_id: external_id || undefined,
                } as CompanyGroup
            };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyGroup, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyGroup);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw error;
        }
    }

    if (bulk && data.length > 0) {
        try {
            const executionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...executionData);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, 0));
            } else {
                throw error;
            }
        }
    }

    return returnData;
}