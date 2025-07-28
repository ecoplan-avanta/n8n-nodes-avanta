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
        displayName: 'External IDs',
        name: 'external_ids',
        type: 'string',
        typeOptions: {
            multipleValues: true,
        },
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['remove'],
            },
        },
        default: [],
        placeholder: 'e.g. XS123, PL456, DO789',
        description: 'A list of external IDs to be deleted.',
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
    const data = this.getNodeParameter('external_ids', 0) as string[];

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
