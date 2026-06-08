import type {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import { createApiRequest } from '../../../transport';
import type { DocumentFile, InvoiceItem, InvoiceReport } from '../../../transport';

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        description: 'ID of the customer',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        description: 'ID of the company',
    },
    {
        displayName: 'Billing Company',
        name: 'billing_company',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        description: 'Billing company name',
    },
    {
        displayName: 'Billing Name',
        name: 'billing_name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
    },
    {
        displayName: 'Customer Invoice ID',
        name: 'customer_invoiceid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        description: 'Invoice ID provided by the customer',
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        description: 'Status of the invoice',
    },
    // Invoice positions
    {
        displayName: 'Invoice Positions Type',
        name: 'invoice_positions_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['invoices'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields Below',
                value: 'mapping',
                description: 'Add invoice positions using fields below',
                action: 'Use fields below to add invoice positions',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add invoice positions',
                action: 'Use raw JSON to add invoice positions',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Invoice Positions',
        name: 'invoice_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: {
            hide: {
                invoice_positions_type: ['json']
            },
            show: {
                resource: ['invoices'],
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
																		type: 'collection',
																		default: {},
																		placeholder: 'Add Item Document Files',
																		options: [
																			{
																				displayName: 'Input Mode',
																				name: 'inputMode',
																				type: 'options',
																				options: [
																					{ name: 'UI Collection', value: 'collection' },
																					{ name: 'Raw JSON', value: 'json' },
																				],
																				default: 'collection',
																				description: 'Choose whether to provide document files via the UI or as JSON',
																			},
																			{
																				displayName: 'Item Document File Collection',
																				name: 'file',
																				type: 'fixedCollection',
																				displayOptions: {
																					show: {
																						inputMode: ['collection'],
																					},
																				},
																				typeOptions: {
																					multipleValues: true,
																				},
																				default: {},
																				placeholder: 'Add Document File',
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
																			{
																				displayName: 'Item Document Files JSON',
																				name: 'itemDocumentFilesJson',
																				type: 'json',
																				displayOptions: {
																					show: {
																						inputMode: ['json'],
																					},
																				},
																				default: '[]',
																				description: 'Provide item document files as JSON array',
																			},
																		],
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
														description: 'Position of the item in the invoice',
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
        displayName: 'Invoice Positions JSON',
        name: 'invoice_positions_json',
        type: 'json',
        displayOptions: {
            hide: {
                invoice_positions_type: ['mapping']
            },
            show: {
                resource: ['invoices'],
                operation: ['create'],
            }
        },
        description: 'Add invoice positions via raw JSON',
        default: '[]',
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'collection',
        default: {},
        placeholder: 'Add Document Files',
        description: 'Invoice document files. You can add them manually or provide a JSON array.',
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        options: [
            {
                displayName: 'Input Mode',
                name: 'inputMode',
                type: 'options',
                options: [
                    { name: 'UI Collection', value: 'collection' },
                    { name: 'Raw JSON', value: 'json' },
                ],
                default: 'collection',
                description: 'Choose whether to provide document files via the UI or as JSON',
            },
            {
                displayName: 'Document File Collection',
                name: 'file',
                type: 'fixedCollection',
                displayOptions: {
                    show: {
                        inputMode: ['collection'],
                    },
                },
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Document File',
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
            {
                displayName: 'Document Files JSON',
                name: 'documentFilesJson',
                type: 'json',
                displayOptions: {
                    show: {
                        inputMode: ['json'],
                    },
                },
                default: '[]',
                description: 'Provide document files as JSON array',
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
        displayOptions: { show: { resource: ['invoices'], operation: ['create'] } },
        // eslint-disable-next-line n8n-nodes-base/node-param-collection-type-unsorted-items
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
            { displayName: 'Invoice Date', name: 'invoice_date', type: 'dateTime', default: '', description: 'Date of the invoice' },
            { displayName: 'Invoice ID', name: 'invoice_id', type: 'number', default: 0, description: 'Internal invoice ID' },
            { displayName: 'Grand Total', name: 'grand_total', type: 'number', default: 0, description: 'Grand total of the invoice' },
            { displayName: 'Tax Amount', name: 'tax_amount', type: 'number', default: 0, description: 'Tax amount of the invoice' },
            { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External invoice ID' },
            { displayName: 'Billing City', name: 'billing_city', type: 'string', default: '', description: 'Invoice billing city' },
            { displayName: 'Billing Country', name: 'billing_country', type: 'string', default: '', description: 'Invoice billing country' },
            { displayName: 'Billing Email', name: 'billing_email', type: 'string', default: '', description: 'Invoice billing email' },
            { displayName: 'Billing Street', name: 'billing_street', type: 'string', default: '', description: 'Invoice billing street' },
            { displayName: 'Billing Telephone', name: 'billing_telephone', type: 'string', default: '', description: 'Invoice billing telephone' },
            { displayName: 'Billing Zip', name: 'billing_zip', type: 'string', default: '', description: 'Invoice billing zip' },
            { displayName: 'Shipping City', name: 'shipping_city', type: 'string', default: '', description: 'Invoice shipping city' },
            { displayName: 'Shipping Company', name: 'shipping_company', type: 'string', default: '', description: 'Invoice shipping company' },
            { displayName: 'Shipping Country', name: 'shipping_country', type: 'string', default: '', description: 'Invoice shipping country' },
            { displayName: 'Shipping Email', name: 'shipping_email', type: 'string', default: '', description: 'Invoice shipping email' },
            { displayName: 'Shipping Name', name: 'shipping_name', type: 'string', default: '', description: 'Invoice shipping name' },
            { displayName: 'Shipping Street', name: 'shipping_street', type: 'string', default: '', description: 'Invoice shipping street' },
            { displayName: 'Shipping Telephone', name: 'shipping_telephone', type: 'string', default: '', description: 'Invoice shipping telephone' },
            { displayName: 'Shipping Zip', name: 'shipping_zip', type: 'string', default: '', description: 'Invoice shipping zip' },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['invoices'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/reports/invoices';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const data: InvoiceReport[] = [];

    const bulk = this.getNodeParameter('bulk', 0) as boolean;

    // List of date fields to format
    const headDateFields = ['invoice_date', 'custom_date1', 'custom_date2'];
    const itemDateFields = ['custom_date1', 'custom_date2', 'desired_date'];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: InvoiceReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                billing_company: this.getNodeParameter('billing_company', i) as string,
                billing_name: this.getNodeParameter('billing_name', i) as string,
                customer_invoiceid: this.getNodeParameter('customer_invoiceid', i) as string,
                status: this.getNodeParameter('status', i) as string,
                invoice_positions: [],
            };

            if (this.getNodeParameter('invoice_positions_type', i) == 'json') {
                report.invoice_positions = this.getNodeParameter('invoice_positions_json', i) as Array<InvoiceItem>;
            } else {
                const positionsCollection = this.getNodeParameter('invoice_positions', i) as {
                    position?: Array<Partial<InvoiceItem> & { additionalFields?: Record<string, any> }>
                };
                const positionsArray = positionsCollection?.position ?? [];
                if (positionsArray.length > 0) {
                    report.invoice_positions = positionsArray.map((p) => {
                        const {additionalFields, ...rest} = p; // Destructure to exclude additionalFields
                        const additionalFieldsProcessed = formatExtensionAttributes.call(this, additionalFields ?? {});
                        // Remove item_document_files and extension_attributes to avoid duplication
                        const {item_document_files, extension_attributes, ...otherFields} = additionalFieldsProcessed;

                        // Format date fields in additionalFields
                        const formattedFields: Record<string, any> = {...otherFields};
                        itemDateFields.forEach((field) => {
                            if (otherFields[field]) {
                                formattedFields[field] = formatDate(otherFields[field] as string);
                            }
                        });

                        // Format date fields in item_document_files
                        let documentFiles: DocumentFile[] = [];
                        const itemFilesConfig = additionalFields?.item_document_files as IDataObject;
                        if (itemFilesConfig) {
                            if (itemFilesConfig.inputMode === 'json' && itemFilesConfig.itemDocumentFilesJson) {
                                try {
                                    const parsed = JSON.parse(itemFilesConfig.itemDocumentFilesJson as string);
                                    if (Array.isArray(parsed)) {
                                        documentFiles = parsed.map((file: any) => ({
                                            ...file,
                                            date: file.date ? formatDate(file.date) : undefined,
                                        }));
                                    }
                                } catch (e) {
                                    throw new Error(`Invalid JSON in Item Document Files: ${(e as Error).message}`);
                                }
                            } else if (itemFilesConfig.file) {
                                const collection = (itemFilesConfig.file as any).file as DocumentFile[];
                                if (Array.isArray(collection)) {
                                    documentFiles = collection.map((file) => ({
                                        ...file,
                                        date: file.date ? formatDate(file.date) : undefined,
                                    }));
                                }
                            }
                        }

                        return {
                            ...rest,
                            ...formattedFields,
                            document_files: documentFiles,
                            extension_attributes: additionalFields?.extension_attributes?.extension_attribute ?? [],
                        } as InvoiceItem;
                    });
                }
            }

            // Map head document files
            const filesConfig = this.getNodeParameter('document_files', i) as IDataObject;
            let filesArray: DocumentFile[] = [];

            if (filesConfig.inputMode === 'json' && filesConfig.documentFilesJson) {
                try {
                    const parsed = JSON.parse(filesConfig.documentFilesJson as string);
                    if (Array.isArray(parsed)) {
                        filesArray = parsed.map((file: any) => ({
                            ...file,
                            date: file.date ? formatDate(file.date) : undefined,
                        }));
                    } else {
                        throw new Error('Document Files JSON must be an array');
                    }
                } catch (err) {
                    throw new Error(`Invalid JSON in Document Files: ${(err as Error).message}`);
                }
            } else if (filesConfig.file) {
                const collection = (filesConfig.file as any).file as DocumentFile[];
                if (Array.isArray(collection)) {
                    filesArray = collection.map((file) => ({
                        ...file,
                        date: file.date ? formatDate(file.date) : undefined,
                    }));
                }
            }
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
