import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import { createApiRequest } from '../../../transport';
import type { DocumentFile, ShipmentItem, ShipmentReport } from '../../../transport';

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['shipments'], operation: ['create'] } },
        description: 'ID of the customer',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: { show: { resource: ['shipments'], operation: ['create'] } },
        description: 'ID of the company',
    },
    {
        displayName: 'Customer Shipment ID',
        name: 'customer_shipmentid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['shipments'], operation: ['create'] } },
        description: 'Shipment ID provided by the customer',
    },
    // Shipment positions
    {
        displayName: 'Shipment Positions Type',
        name: 'shipment_positions_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['shipments'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields below',
                value: 'mapping',
                description: 'Add shipment positions using fields below',
                action: 'Use fields below to add shipment positions',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add shipment positions',
                action: 'Use raw JSON to add shipment positions',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Shipment Positions',
        name: 'shipment_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: {
            hide: {
                shipment_positions_type: ['json']
            },
            show: {
                resource: ['shipments'],
                operation: ['create']
            }
        },
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
                                                                        typeOptions: { multipleValues: true },
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
															required:	true,
														default: 0,
														description: 'Position of the item in the shipment',
													},
													{
														displayName: 'Name',
														name: 'name',
														type: 'string',
															required:	true,
														default: '',
														description: 'Name of the item',
													},
													{
														displayName: 'Price',
														name: 'price',
														type: 'number',
															required:	true,
														default: 0,
														description: 'Price of the item',
													},
													{
														displayName: 'Quantity',
														name: 'qty',
														type: 'number',
															required:	true,
														default: 0,
														description: 'Quantity of the item',
													},
													{
														displayName: 'SKU',
														name: 'sku',
														type: 'string',
															required:	true,
														default: '',
														description: 'Stock Keeping Unit',
													},
													{
														displayName: 'Subtotal',
														name: 'subtotal',
														type: 'number',
															required:	true,
														default: 0,
														description: 'Subtotal for the item',
													},
													],
            },
        ],
    },
    {
        displayName: 'Shipment Positions JSON',
        name: 'shipment_positions_json',
        type: 'json',
        displayOptions: {
            hide: {
                shipment_positions_type: ['mapping']
            },
            show: {
                resource: ['shipments'],
                operation: ['create'],
            }
        },
        description: 'Add shipment positions via raw JSON',
        default: '[]',
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { show: { resource: ['shipments'], operation: ['create'] } },
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
        displayOptions: { show: { resource: ['shipments'], operation: ['create'] } },
        options: [
            { displayName: 'Custom Date 1', name: 'custom_date1', type: 'dateTime', default: '', description: 'Custom date field 1' },
            { displayName: 'Custom Date 2', name: 'custom_date2', type: 'dateTime', default: '', description: 'Custom date field 2' },
            { displayName: 'Custom Price 1', name: 'custom_price1', type: 'number', default: 0, description: 'Custom price field 1' },
            { displayName: 'Custom Price 2', name: 'custom_price2', type: 'number', default: 0, description: 'Custom price field 2' },
            { displayName: 'Custom Text 1', name: 'custom_text1', type: 'string', default: '', description: 'Custom text field 1' },
            { displayName: 'Custom Text 2', name: 'custom_text2', type: 'string', default: '', description: 'Custom text field 2' },
            { displayName: 'Customer Order ID', name: 'customer_orderid', type: 'string', default: '', description: 'Order ID provided by the customer' },
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
            { displayName: 'Order ID', name: 'order_id', type: 'number', default: 0, description: 'Internal order ID' },
            { displayName: 'Shipment Date', name: 'shipment_date', type: 'dateTime', default: '', description: 'Date of the shipment' },
            { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the shipment' },
            { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External shipment ID' },
            { displayName: 'Grand Total', name: 'grand_total', type: 'number', default: 0, description: 'Grand total of the shipment' },
            { displayName: 'Tax Amount', name: 'tax_amount', type: 'number', default: 0, description: 'Tax amount of the shipment' },
            { displayName: 'Shipping City', name: 'shipping_city', type: 'string', default: '', description: 'Shipment shipping city' },
            { displayName: 'Shipping Company', name: 'shipping_company', type: 'string', default: '', description: 'Shipment shipping company' },
            { displayName: 'Shipping Country', name: 'shipping_country', type: 'string', default: '', description: 'Shipment shipping country' },
            { displayName: 'Shipping Email', name: 'shipping_email', type: 'string', default: '', description: 'Shipment shipping email' },
            { displayName: 'Shipping Name', name: 'shipping_name', type: 'string', default: '', description: 'Shipment shipping name' },
            { displayName: 'Shipping Street', name: 'shipping_street', type: 'string', default: '', description: 'Shipment shipping street' },
            { displayName: 'Shipping Telephone', name: 'shipping_telephone', type: 'string', default: '', description: 'Shipment shipping telephone' },
            { displayName: 'Shipping Zip', name: 'shipping_zip', type: 'string', default: '', description: 'Shipment shipping zip' },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['shipments'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/reports/shipments';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const data: ShipmentReport[] = [];

    const bulk = this.getNodeParameter('bulk', 0) as boolean;

    // List of date fields to format
    const headDateFields = ['shipment_date', 'custom_date1', 'custom_date2'];
    const itemDateFields = ['custom_date1', 'custom_date2', 'desired_date'];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: ShipmentReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                customer_shipmentid: this.getNodeParameter('customer_shipmentid', i) as string,
                shipment_positions: [],
            };

            if (this.getNodeParameter('shipment_positions_type', i) == 'json') {
                report.shipment_positions = this.getNodeParameter('shipment_positions_json', i) as Array<ShipmentItem>;
            } else {
                const positionsCollection = this.getNodeParameter('shipment_positions', i) as {
                    position?: Array<Partial<ShipmentItem> & { additionalFields?: Record<string, any> }>
                };
                const positionsArray = positionsCollection?.position ?? [];
                if (positionsArray.length > 0) {
                    report.shipment_positions = positionsArray.map((p) => {
                        const {additionalFields, ...rest} = p;
                        const additionalFieldsProcessed = formatExtensionAttributes.call(this, additionalFields ?? {});
                        const {item_document_files, extension_attributes, ...otherFields} = additionalFieldsProcessed;

                        // Format date fields in additionalFields
                        const formattedFields: Record<string, any> = {...otherFields};
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
                        } as ShipmentItem;
                    });
                }
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
