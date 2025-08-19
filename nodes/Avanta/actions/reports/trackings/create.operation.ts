import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import { createApiRequest } from '../../../transport';
import type { TrackingReport } from '../../../transport';

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: { show: { resource: ['trackings'], operation: ['create'] } },
        description: 'ID of the company',
    },
    {
        displayName: 'Tracking Code',
        name: 'tracking_code',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['trackings'], operation: ['create'] } },
        description: 'Tracking code for the shipment',
    },
    // Additional Fields
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['trackings'], operation: ['create'] } },
        options: [
            { displayName: 'Created At', name: 'created_at', type: 'dateTime', default: '', description: 'Creation date of the tracking' },
            { displayName: 'Customer Order ID', name: 'customer_orderid', type: 'string', default: '', description: 'Order ID provided by the customer' },
            { displayName: 'Customer Shipment ID', name: 'customer_shipmentid', type: 'string', default: '', description: 'Shipment ID provided by the customer' },
            {
                displayName: 'Extension Attributes',
                name: 'extension_attributes',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                default: {},
                placeholder: 'Add Extension Attribute',
                options: [
                    {
                        displayName: 'Extension Attribute',
                        name: 'extension_attribute',
                        values: [
                            {
                                displayName: 'Extension Attribute Name or ID',
                                name: 'attribute_code',
                                type: 'options',
                                description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                typeOptions: {
                                    loadOptionsMethod: 'getExtensionAttributes',
                                },
                                default: '',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                            },
                        ],
                    },
                ],
            },
            { displayName: 'Notice', name: 'notice', type: 'string', default: '', description: 'Additional notice for the tracking' },
            { displayName: 'Order ID', name: 'order_id', type: 'number', default: 0, description: 'Internal order ID' },
            { displayName: 'Provider', name: 'provider', type: 'string', default: '', description: 'Shipping provider' },
            { displayName: 'Shipment ID', name: 'shipment_id', type: 'number', default: 0, description: 'Internal shipment ID' },
            { displayName: 'Tracking Date', name: 'tracking_date', type: 'dateTime', default: '', description: 'Date of the tracking' },
            { displayName: 'Tracking ID', name: 'tracking_id', type: 'number', default: 0, description: 'Internal tracking ID' },
            { displayName: 'Updated At', name: 'updated_at', type: 'dateTime', default: '', description: 'Last update date of the tracking' },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['trackings'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/reports/trackings';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const data: TrackingReport[] = [];

    // List of date fields to format
    const dateFields = ['created_at', 'tracking_date', 'updated_at'];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: TrackingReport = {
                company_id: this.getNodeParameter('company_id', i) as number,
                tracking_code: this.getNodeParameter('tracking_code', i) as string,
            };

            // Map optional additional fields
            const additionalFields = formatExtensionAttributes.call(this, this.getNodeParameter('additionalFields', i) as Record<string, any>);
            if (Object.keys(additionalFields).length > 0) {
                const formattedFields: Record<string, any> = { ...additionalFields };
                dateFields.forEach((field) => {
                    if (additionalFields[field]) {
                        formattedFields[field] = formatDate(additionalFields[field] as string);
                    }
                });
                Object.assign(report, formattedFields);
            }

            data.push(report);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw error;
        }
    }

    try {
        const body = {
            trackingData: data,
        };
        const executionData = await createApiRequest.call(this, body, restUrl, false);
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
