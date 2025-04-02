import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['deactivate'],
            },
        },
        default: '',
    }
];

const displayOptions = {
    show: {
        resource: ['company'],
        operation: ['deactivate'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/company/disablebywhitelistexternal';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    let data = [];
    for (let i = 0; i < this.getInputData().length; i++) {
        data.push(this.getNodeParameter('customer_id', i) as string);
    }
    try {
        const executionData = await createApiRequest.call(this, {'externalIds': data}, restUrl, false, 0);
        returnData.push(...executionData);
    } catch (error) {
        if (this.continueOnFail()) {
            returnData.push(...prepareErrorData.call(this, error, 0));
        } else {
            throw error;
        }
    }
    return returnData;
}
