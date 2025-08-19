import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Store Group Name or ID',
        name: 'store_group_id',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['deactivate'],
            },
        },
        default: '',
        required: true,
        description: 'The store group ID to associate with the deactivation. Uses the first item\'s value. Supports <a href="https://docs.n8n.io/code/expressions/">n8n expressions</a> for dynamic input. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
    {
        displayName: 'External IDs',
        name: 'externalIds',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['deactivate'],
            },
        },
        description: 'Whitelist of external IDs to remain active (e.g., EXT1,EXT2 or ["EXT1", "EXT2"] via <a href="https://docs.n8n.io/code/expressions/">n8n expressions</a>). All other companies are deactivated. Use comma-separated IDs or a JSON array/single ID. Leave empty to skip an item.',
    },
];

const displayOptions = {
    show: {
        resource: ['company'],
        operation: ['deactivate'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/company/disablebywhitelistexternal';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const allExternalIds: string[] = [];
    const returnData: INodeExecutionData[] = [];
    const groupId = this.getNodeParameter('store_group_id', 0) as string;

    for (let i = 0; i < items.length; i++) {
        try {
            const externalIdsInput = this.getNodeParameter('externalIds', i) as string;
            let externalIds: string[] = [];
            if (externalIdsInput.trim()) {
                try {
                    const parsed = JSON.parse(externalIdsInput);
                    externalIds = Array.isArray(parsed) ? parsed : [parsed];
                    if (!externalIds.every(id => typeof id === 'string')) {
                        throw new NodeApiError(this.getNode(), { message: 'External IDs must be strings' });
                    }
                } catch {
                    externalIds = externalIdsInput.split(',').map(id => id.trim()).filter(id => id);
                }
            }
            allExternalIds.push(...externalIds);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw new NodeApiError(this.getNode(), error);
        }
    }

    try {
        const requestData = { externalIds: [...new Set(allExternalIds)], storeGroupId: groupId };
        const executionData = await createApiRequest.call(this, requestData, restUrl, false, 0);
        returnData.push(...executionData);
    } catch (error) {
        if (this.continueOnFail()) {
            returnData.push(...prepareErrorData.call(this, error, 0));
        } else {
            throw new NodeApiError(this.getNode(), error);
        }
    }

    return returnData;
}