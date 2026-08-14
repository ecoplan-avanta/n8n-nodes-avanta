import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    NodeApiError
} from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'External ID',
        name: 'external_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['remove'],
            },
        },
        default: '',
    }
];

const displayOptions = {
    show: {
        resource: ['companyContact'],
        operation: ['remove'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/contact/deleteByExternalId';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    let data = [];
    for (let i = 0; i < this.getInputData().length; i++) {
        data.push(this.getNodeParameter('external_id', i) as string);
    }

    try {
        await createApiRequest.call(this, {'externalIds': data}, restUrl, false, 0);
        returnData.push({ json: { deleted: true } });
    } catch (error) {
        if (this.continueOnFail()) {
            returnData.push(...prepareErrorData.call(this, error, 0));
        } else {
            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }
    return returnData;
}
