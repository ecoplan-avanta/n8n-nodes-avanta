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
        displayName: 'Contact External ID',
        name: 'contact_external_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['linkSalesorg']
            }
        },
        default: ''
    },
    {
        displayName: 'Sales Org External ID',
        name: 'salesorg_external_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['linkSalesorg']
            }
        },
        default: ''
    },
    {
        displayName: 'Store Group Name or ID',
        name: 'group_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        default: '',
    }
];

const displayOptions = {
    show: {
        resource: ['companyContact'],
        operation: ['linkSalesorg']
    }
}

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/contact/contactSalesOrgAssignmentByExternalId';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const contactExternalId = this.getNodeParameter('contact_external_id', i) as string;
            const salesOrgExternalId = this.getNodeParameter('salesorg_external_id', i) as string;
            let groupId = this.getNodeParameter('group_id', i) as number;

            if (!groupId) {
                groupId = 1;
            }

            let contactSalesOrgLink = {
                'contactExternalId': contactExternalId,
                'salesOrgExternalId': salesOrgExternalId,
                'groupId': groupId
            };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, contactSalesOrgLink, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(contactSalesOrgLink);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }

    if (bulk && data.length > 0) {
        try {
            const exceutionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...exceutionData);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, 0));
            } else {
                throw new NodeApiError(this.getNode(), error as JsonObject);
            }
        }
    }

    return returnData;
}
