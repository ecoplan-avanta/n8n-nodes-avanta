import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import { createApiRequest } from '../../../transport';
import type { DocumentFile, BackorderItem, BackorderReport } from '../../../transport';

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        description: 'ID of the customer',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        description: 'ID of the company',
    },
    {
        displayName: 'Customer Order ID',
        name: 'customer_orderid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        description: 'Order ID provided by the customer',
    },
    {
        displayName: 'Bulk',
        name: 'bulk',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        description: 'Whether to process as bulk operation',
    },
    // Backorder positions
    {
        displayName: 'Backorder Positions',
        name: 'backorder_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        options: [
            {
                name: 'position',
                displayName: 'Position',
                values: [
													{
														displayName: 'Additional Fields',
														name: 'additionalFields',
														type: 'collection',
														default: {},
														placeholder: 'Add Field',
														options: [
																	{
																		displayName: 'Batch Number',
																		name: 'batch_no',
																		type: 'string',
																		default: '',
																		description: 'Batch number of the item',
																	},
																	{
																		displayName: 'Comment',
																		name: 'comment',
																		type: 'string',
																		default: '',
																		description: 'Comment for the item',
																	},
																	{
																		displayName: 'Commission',
																		name: 'commission',
																		type: 'string',
																		default: '',
																		description: 'Commission information',
																	},
																	{
																		displayName: 'Company SKU',
																		name: 'company_sku',
																		type: 'string',
																		default: '',
																		description: 'Company-specific SKU',
																	},
																	{
																		displayName: 'Custom Date 1',
																		name: 'custom_date1',
																		type: 'dateTime',
																		default: '',
																		description: 'Custom date field 1',
																	},
																	{
																		displayName: 'Custom Date 2',
																		name: 'custom_date2',
																		type: 'dateTime',
																		default: '',
																		description: 'Custom date field 2',
																	},
																	{
																		displayName: 'Custom Price 1',
																		name: 'custom_price1',
																		type: 'number',
																		default: 0,
																		description: 'Custom price field 1',
																	},
																	{
																		displayName: 'Custom Price 2',
																		name: 'custom_price2',
																		type: 'number',
																		default: 0,
																		description: 'Custom price field 2',
																	},
																	{
																		displayName: 'Custom Quantity 1',
																		name: 'custom_qty1',
																		type: 'number',
																		default: 0,
																		description: 'Custom quantity field 1',
																	},
																	{
																		displayName: 'Custom Quantity 2',
																		name: 'custom_qty2',
																		type: 'number',
																		default: 0,
																		description: 'Custom quantity field 2',
																	},
																	{
																		displayName: 'Custom Text 1',
																		name: 'custom_text1',
																		type: 'string',
																		default: '',
																		description: 'Custom text field 1',
																	},
																	{
																		displayName: 'Custom Text 2',
																		name: 'custom_text2',
																		type: 'string',
																		default: '',
																		description: 'Custom text field 2',
																	},
																	{
																		displayName: 'Desired Date',
																		name: 'desired_date',
																		type: 'dateTime',
																		default: '',
																		description: 'Desired delivery date for the item',
																	},
																	{
																		displayName: 'Discount',
																		name: 'discount',
																		type: 'number',
																		default: 0,
																		description: 'Discount applied to the item',
																	},
																	{
																		displayName: 'EAN',
																		name: 'ean',
																		type: 'string',
																		default: '',
																		description: 'European Article Number',
																	},
																	{
																		displayName: 'Estimated Delivery Date',
																		name: 'estimated_delivery_date',
																		type: 'dateTime',
																		default: '',
																		description: 'Estimated delivery date for the item',
																	},
																	{
																		displayName: 'Extension Attributes',
																		name: 'extension_attributes',
																		type: 'fixedCollection',
																		default: {},
																		placeholder: 'Add Extension Attribute',
																		options: [
																			{
																				displayName: 'Extension Attribute',
																				name: 'extension_attribute',
																					values:	[
																							{
																								displayName: 'Extension Attribute',
																								name: 'attribute_code',
																								type: 'options',
																								default: '',
																							},
																							{
																								displayName: 'Value',
																								name: 'value',
																								type: 'string',
																								default: '',
																							},
																					]
																			},
																			]
																	},
																	{
																		displayName: 'Item Document Files',
																		name: 'item_document_files',
																		type: 'fixedCollection',
																		default: {},
																		options: [
																			{
																				name: 'file',
																				displayName: 'File',
																					values:	[
																							{
																								displayName: 'Document ID',
																								name: 'document_id',
																								type: 'string',
																								default: '',
																							},
																							{
																								displayName: 'Type',
																								name: 'type',
																								type: 'string',
																								default: '',
																							},
																							{
																								displayName: 'File',
																								name: 'file',
																								type: 'string',
																								default: '',
																							},
																							{
																								displayName: 'Date',
																								name: 'date',
																								type: 'dateTime',
																								default: '',
																							},
																						]
																			},
																			]
																	},
																	{
																		displayName: 'Packaging Unit',
																		name: 'packaging_unit',
																		type: 'string',
																		default: '',
																		description: 'Packaging unit of the item',
																	},
																	{
																		displayName: 'Status',
																		name: 'status',
																		type: 'string',
																		default: '',
																		description: 'Status of the item',
																	},
																	{
																		displayName: 'Tax Amount',
																		name: 'tax_amount',
																		type: 'number',
																		default: 0,
																		description: 'Tax amount for the item',
																	},
																	{
																		displayName: 'Tax Percent',
																		name: 'tax_percent',
																		type: 'number',
																		default: 0,
																		description: 'Tax percentage for the item',
																	},
															]
													},
													{
														displayName: 'Item Position',
														name: 'item_pos',
														type: 'number',
														default: 0,
														description: 'Position of the item in the backorder',
													},
													{
														displayName: 'Name',
														name: 'name',
														type: 'string',
														default: '',
														description: 'Name of the item',
													},
													{
														displayName: 'Price',
														name: 'price',
														type: 'number',
														default: 0,
														description: 'Price of the item',
													},
													{
														displayName: 'Quantity',
														name: 'qty',
														type: 'number',
														default: 0,
														description: 'Quantity of the item',
													},
													{
														displayName: 'SKU',
														name: 'sku',
														type: 'string',
														default: '',
														description: 'Stock Keeping Unit',
													},
													{
														displayName: 'Subtotal',
														name: 'subtotal',
														type: 'number',
														default: 0,
														description: 'Subtotal for the item',
													},
													],
            },
        ],
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        options: [
            {
                name: 'file',
                displayName: 'File',
                values: [
                    { displayName: 'Document ID', name: 'document_id', type: 'string', default: '' },
                    { displayName: 'Type', name: 'type', type: 'string', default: '' },
                    { displayName: 'File', name: 'file', type: 'string', default: '' },
                    { displayName: 'Date', name: 'date', type: 'dateTime', default: '' },
                ],
            },
        ],
    },
    // Additional Fields
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['backorders'], operation: ['create'] } },
        options: [
            { displayName: 'Backorder Date', name: 'backorder_date', type: 'dateTime', default: '', description: 'Date of the backorder' },
            { displayName: 'Backorder ID', name: 'backorder_id', type: 'number', default: 0, description: 'Internal backorder ID' },
            { displayName: 'Comment', name: 'comment', type: 'string', default: '', description: 'Comment for the backorder' },
            { displayName: 'Custom Date 1', name: 'custom_date1', type: 'dateTime', default: '', description: 'Custom date field 1' },
            { displayName: 'Custom Date 2', name: 'custom_date2', type: 'dateTime', default: '', description: 'Custom date field 2' },
            { displayName: 'Custom Price 1', name: 'custom_price1', type: 'number', default: 0, description: 'Custom price field 1' },
            { displayName: 'Custom Price 2', name: 'custom_price2', type: 'number', default: 0, description: 'Custom price field 2' },
            { displayName: 'Custom Text 1', name: 'custom_text1', type: 'string', default: '', description: 'Custom text field 1' },
            { displayName: 'Custom Text 2', name: 'custom_text2', type: 'string', default: '', description: 'Custom text field 2' },
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
            { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the backorder' },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['backorders'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/reports/backorders';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const data: BackorderReport[] = [];

    const bulk = this.getNodeParameter('bulk', 0) as boolean;

    // List of date fields to format
    const headDateFields = ['backorder_date', 'custom_date1', 'custom_date2'];
    const itemDateFields = ['custom_date1', 'custom_date2', 'desired_date', 'estimated_delivery_date'];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: BackorderReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                customer_orderid: this.getNodeParameter('customer_orderid', i) as string,
                backorder_positions: [],
            };

            const positionsCollection = this.getNodeParameter('backorder_positions', i) as { position?: Array<Partial<BackorderItem> & { additionalFields?: Record<string, any> }> };
            const positionsArray = positionsCollection?.position ?? [];
            if (positionsArray.length > 0) {
                report.backorder_positions = positionsArray.map((p) => {
                    const { additionalFields, ...rest } = p;
                    const additionalFieldsProcessed = formatExtensionAttributes.call(this, additionalFields ?? {});
                    const { item_document_files, extension_attributes, ...otherFields } = additionalFieldsProcessed;

                    // Format date fields in additionalFields
                    const formattedFields: Record<string, any> = { ...otherFields };
                    itemDateFields.forEach((field) => {
                        if (otherFields[field]) {
                            formattedFields[field] = formatDate(otherFields[field] as string);
                        }
                    });

                    // Format date fields in item_document_files
                    const documentFiles = (additionalFields?.item_document_files?.file ?? []).map((file: DocumentFile) => ({
                        ...file,
                        date: file.date ? formatDate(file.date) : undefined,
                    }));

                    return {
                        ...rest,
                        ...formattedFields,
                        document_files: documentFiles,
                        extension_attributes: additionalFields?.extension_attributes?.extension_attribute ?? [],
                    } as BackorderItem;
                });
            }

            // Map head document files
            const filesCollection = this.getNodeParameter('document_files', i) as { file?: DocumentFile[] };
            const filesArray = (filesCollection?.file ?? []).map((file) => ({
                ...file,
                date: file.date ? formatDate(file.date) : undefined,
            }));
            if (filesArray.length > 0) {
                report.document_files = filesArray;
            }

            // Map optional additional fields
            const additionalFields = formatExtensionAttributes.call(this, this.getNodeParameter('additionalFields', i) as Record<string, any>);
            if (Object.keys(additionalFields).length > 0) {
                const formattedFields: Record<string, any> = { ...additionalFields };
                headDateFields.forEach((field) => {
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
            reportData: data,
            asBulk: bulk,
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
