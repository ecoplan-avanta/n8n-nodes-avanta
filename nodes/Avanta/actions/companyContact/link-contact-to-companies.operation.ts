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
        displayName: 'Contact external ID',
        name: 'contact_external_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['linkCompany']
            }
        },
        default: ''
    },
    {
        displayName: 'Customer ID',
        name: 'company_external_id',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['linkCompany']
            }
        },
        default: ''
    },
    {
        displayName: 'Store Group ID',
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
        operation: ['linkCompany']
    }
}

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/contact/companycontactbyexternalid';

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
            const companyExternalId = this.getNodeParameter('company_external_id', i) as string;
            let groupId = this.getNodeParameter('group_id', i) as number;

            if (!groupId) {
                groupId = 1;
            }

            let contactCompanyLink = {
                'contactExternalId': contactExternalId,
                'companyExternalId': companyExternalId,
                'groupId': groupId
            };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, contactCompanyLink, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(contactCompanyLink);
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
            const exceutionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...exceutionData);
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
