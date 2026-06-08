import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {prepareErrorData} from "../../helpers/utils";
import {magentoApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'SKU',
        name: 'sku',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['remove'],
            },
        },
        default: '',
    }
];

const displayOptions = {
    show: {
        resource: ['product'],
        operation: ['remove'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/products';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < this.getInputData().length; i++) {
        try {
            const sku = this.getNodeParameter('sku', i) as string;
            await magentoApiRequest.call(this, 'DELETE', restUrl + '/' + sku);
            returnData.push({ json: { deleted: true } });
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
