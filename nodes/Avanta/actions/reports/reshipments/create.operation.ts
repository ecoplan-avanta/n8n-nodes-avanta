import type {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import { createApiRequest } from '../../../transport';
import type { DocumentFile, ReshipmentItem, ReshipmentReport } from '../../../transport';

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['reshipments'], operation: ['create'] } },
        description: 'ID of the customer',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: { show: { resource: ['reshipments'], operation: ['create'] } },
        description: 'ID of the company',
    },
    {
        displayName: 'Customer Reshipment ID',
        name: 'customer_reshipmentid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['reshipments'], operation: ['create'] } },
        description: 'Reshipment ID provided by the customer',
    },
    // Reshipment positions
    {
        displayName: 'Reshipment Positions Type',
        name: 'reshipment_positions_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['reshipments'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields below',
                value: 'mapping',
                description: 'Add reshipment positions using fields below',
                action: 'Use fields below to add reshipment positions',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add reshipment positions',
                action: 'Use raw JSON to add reshipment positions',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Reshipment Positions',
        name: 'reshipment_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: {
            hide: {
                reshipment_positions_type: ['json']
            },
            show: {
                resource: ['reshipments'],
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
																				description: 'Provide item document files as JSON array.',
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
														description: 'Position of the item in the reshipment',
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
        displayName: 'Reshipment Positions JSON',
        name: 'reshipment_positions_json',
        type: 'json',
        displayOptions: {
            hide: {
                reshipment_positions_type: ['mapping']
            },
            show: {
                resource: ['reshipments'],
                operation: ['create'],
            }
        },
        description: 'Add reshipment positions via raw JSON',
        default: '[]',
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'collection',
        default: {},
        placeholder: 'Add Document Files',
        description: 'Reshipment document files. You can add them manually or provide a JSON array.',
        displayOptions: { show: { resource: ['reshipments'], operation: ['create'] } },
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
                description: 'Provide document files as JSON array.',
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
        displayOptions: { show: { resource: ['reshipments'], operation: ['create'] } },
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
            { displayName: 'Reshipment Date', name: 'reshipment_date', type: 'dateTime', default: '', description: 'Date of the reshipment' },
            { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the reshipment' },
            { displayName: 'Grand Total', name: 'grand_total', type: 'number', default: 0, description: 'Grand total of the reshipment' },
            { displayName: 'Tax Amount', name: 'tax_amount', type: 'number', default: 0, description: 'Tax amount of the reshipment' },
            { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External reshipment ID' },
            { displayName: 'Billing City', name: 'billing_city', type: 'string', default: '', description: 'Reshipment billing city' },
            { displayName: 'Billing Company', name: 'billing_company', type: 'string', default: '', description: 'Reshipment billing company' },
            { displayName: 'Billing Country', name: 'billing_country', type: 'string', default: '', description: 'Reshipment billing country' },
            { displayName: 'Billing Email', name: 'billing_email', type: 'string', default: '', description: 'Reshipment billing email' },
            { displayName: 'Billing Name', name: 'billing_name', type: 'string', default: '', description: 'Reshipment billing name' },
            { displayName: 'Billing Street', name: 'billing_street', type: 'string', default: '', description: 'Reshipment billing street' },
            { displayName: 'Billing Telephone', name: 'billing_telephone', type: 'string', default: '', description: 'Reshipment billing telephone' },
            { displayName: 'Billing Zip', name: 'billing_zip', type: 'string', default: '', description: 'Reshipment billing zip' },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['reshipments'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/reports/reshipments';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const data: ReshipmentReport[] = [];

    const bulk = this.getNodeParameter('bulk', 0) as boolean;

    // List of date fields to format
    const headDateFields = ['reshipment_date', 'custom_date1', 'custom_date2'];
    const itemDateFields = ['custom_date1', 'custom_date2', 'desired_date'];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: ReshipmentReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                customer_reshipmentid: this.getNodeParameter('customer_reshipmentid', i) as string,
                reshipment_positions: [],
            };

            if (this.getNodeParameter('reshipment_positions_type', i) == 'json') {
                report.reshipment_positions = this.getNodeParameter('reshipment_positions_json', i) as Array<ReshipmentItem>;
            } else {
                const positionsCollection = this.getNodeParameter('reshipment_positions', i) as {
                    position?: Array<Partial<ReshipmentItem> & { additionalFields?: Record<string, any> }>
                };
                const positionsArray = positionsCollection?.position ?? [];
                if (positionsArray.length > 0) {
                    report.reshipment_positions = positionsArray.map((p) => {
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
                        } as ReshipmentItem;
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
