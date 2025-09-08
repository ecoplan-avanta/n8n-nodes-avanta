import {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";
import type {
    Product,
    DynamicCustomAttribute,
    ProductSymbol,
    MediaGalleryEntry,
    DownloadItem,
    ProductLink
} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'SKU',
        name: 'sku',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        description: 'Stock-keeping unit of the product',
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        default: '',
    },
    {
        displayName: 'Attribute Set Name or ID',
        name: 'attributeSetId',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        typeOptions: {
            loadOptionsMethod: 'getAttributeSets',
        },
        default: '',
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
            {
                name: 'Enabled',
                value: 1,
            },
            {
                name: 'Disabled',
                value: 2,
            },
        ],
        default: 1,
    },
    {
        displayName: 'Type Name or ID',
        name: 'type_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getProductTypes',
        },
        default: '',
    },
    {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        default: 0,
    },
    {
        displayName: 'Visibility',
        name: 'visibility',
        type: 'options',
        options: [
            {
                name: 'Not Visible',
                value: 1,
            },
            {
                name: 'Catalog',
                value: 2,
            },
            {
                name: 'Search',
                value: 3,
            },
            {
                name: 'Catalog & Search',
                value: 4,
            },
        ],
        default: 4,
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        options: [...getProductOptionalFields()],
    }
];

const displayOptions = {
    show: {
        resource: ['product'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/connector/products';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const sku = this.getNodeParameter('sku', i) as string;
            const name = this.getNodeParameter('name', i) as string;
            const attributeSetId = this.getNodeParameter('attributeSetId', i) as number;
            const status = this.getNodeParameter('status', i) as number;
            const typeId = this.getNodeParameter('type_id', i) as string;
            const price = this.getNodeParameter('price', i) as number;
            const visibility = this.getNodeParameter('price', i, 4) as number;
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );
            additionalFields = formatExtensionAttributes.call(this, additionalFields);

            // Create product object
            const product: Product = {
                sku: sku,
                attribute_set_id: attributeSetId,
                status: status,
                type_id: typeId,
                visibility: visibility
            };

            // Add optional fields only if they are provided
            if (name !== '') {
                product.name = name;
            }

            if (price !== null) {
                product.price = price;
            }

            const productData = {
                product
            };

            // Handle custom attributes
            if (additionalFields.customAttributes) {
                let collection = ((additionalFields.customAttributes as IDataObject).customAttribute  as IDataObject[]);
                productData.product.dynamic_custom_attributes = collection.map((attr: any) => {
                    return {
                        attribute_code: attr.attribute_code,
                        value: attr.value
                    };
                });
            }

            // Handle dynamic custom attributes if provided
            if (additionalFields.dynamicCustomAttributes) {
                let collection = ((additionalFields.dynamicCustomAttributes as IDataObject).dynamicCustomAttribute  as IDataObject[]);
                productData.product.dynamic_custom_attributes = collection.map((attr: any): DynamicCustomAttribute => {
                        let value: any;

                        try {
                            const parsed = JSON.parse(attr.value);
                            value = typeof parsed === 'object' && parsed !== null ? parsed : attr.value;
                        } catch {
                            value = attr.value;
                        }

                        return {
                            attribute_code: attr.attribute_code,
                            value
                        };
                    });
            }

            // Handle product symbols if provided
            if (additionalFields.productSymbols) {
                let collection = ((additionalFields.productSymbols as IDataObject).productSymbol  as IDataObject[]);
                productData.product.product_symbols = collection.map((symbol: any): ProductSymbol => ({
                    extension_attributes: {
                        sku: symbol.sku,
                        symbol_codes: symbol.symbol_codes
                    },
                    store_id: symbol.store_id || 0
                }));
            }

            // Handle media gallery entries if provided
            if (additionalFields.mediaGalleryEntries) {
                let collection = ((additionalFields.mediaGalleryEntries as IDataObject).mediaGalleryEntry  as IDataObject[]);
                productData.product.dynamic_media_gallery_entries = collection.map((entry: any) => {
                    const mediaEntry: MediaGalleryEntry = {
                        media_type: entry.media_type || 'image',
                        position: entry.position || 1,
                        disabled: entry.disabled || false,
                        label: entry.label || '',
                        scope: entry.scope || 'stores',
                        types: entry.types || ['image', 'small_image', 'thumbnail'],
                        file: entry.file || ''
                    };

                    // Handle content if provided
                    if (entry.content && entry.content.contentDetails) {
                        mediaEntry.content = {
                            content: entry.content.contentDetails.content || '',
                            name: entry.content.contentDetails.name || ''
                        };
                    }

                    return mediaEntry;
                });
            }

            // Handle download items if provided
            if (additionalFields.downloadItems) {
                let collection = ((additionalFields.downloadItems as IDataObject).downloadItem  as IDataObject[]);
                productData.product.download_items = collection.map((item: any): DownloadItem => ({
                    status: item.status || 1,
                    show_in_portal: item.show_in_portal || 0,
                    title: item.title || '',
                    external_id: item.external_id || '',
                    visibility: item.visibility || 3,
                    product_all: item.product_all || 0,
                    filename: item.filename || '',
                    extension_attributes: {
                        content: item.content || '',
                        store_id: item.store_id || 1,
                        external_category_ids: item.external_category_ids || [],
                        external_company_ids: item.external_company_ids || [],
                        skus: item.skus || []
                    }
                }));
            }

            // Handle product links if provided
            if (additionalFields.productLinks) {
                let collection = ((additionalFields.productLinks as IDataObject).productLink  as IDataObject[]);
                productData.product.product_links = collection.map((link: any): ProductLink => ({
                    sku: sku,
                    linked_product_sku: link.linked_product_sku,
                    link_type: link.link_type
                }));
            }

            // Handle external category links if provided
            if (additionalFields.externalCategoryLinks) {
                if (!productData.product.extension_attributes) {
                    productData.product.extension_attributes = {};
                }
                let collection = ((additionalFields.externalCategoryLinks as IDataObject).externalCategoryLink  as IDataObject[]);
                productData.product.extension_attributes.external_category_links = collection.map((link: any) => ({
                    external_category_id: link.external_category_id
                }));
            }

            //console.log(JSON.stringify(productData, null, 2));
            if (!bulk) {
                const executionData = await createApiRequest.call(this, productData, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(productData);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw error;
        }
    }

    if (bulk) {
        try {
            const executionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...executionData);
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


function getProductOptionalFields(): INodeProperties[] {
    return [
        {
            displayName: 'Dynamic Custom Attributes',
            name: 'dynamicCustomAttributes',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Dynamic Custom Attribute',
            options: [
                {
                    displayName: 'Dynamic Custom Attribute',
                    name: 'dynamicCustomAttribute',
                    values: [
                        {
                            displayName: 'Attribute Code Name or ID',
                            name: 'attribute_code',
                            type: 'options',
                            typeOptions: {
                                loadOptionsMethod: 'getProductAttributes',
                            },
                            default: '',
                            description: 'Code of the attribute. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
                        },
                        {
                            displayName: 'Value',
                            name: 'value',
                            type: 'json',
                            default: '',
                            description: 'Value of the attribute. Can be a string or an array in the format [{"key": "Admin Key", "value": "Translation"}].',
                        },
                    ],
                },
            ],
        },
        {
            displayName: 'Product Symbols',
            name: 'productSymbols',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Product Symbol',
            options: [
                {
                    displayName: 'Product Symbol',
                    name: 'productSymbol',
                    values: [
                        {
                            displayName: 'SKU',
                            name: 'sku',
                            type: 'string',
                            default: '',
                            description: 'SKU of the product',
                        },
                        {
                            displayName: 'Symbol Codes',
                            name: 'symbol_codes',
                            type: 'string',
                            typeOptions: {
                                multipleValues: true,
                            },
                            default: [],
                            description: 'Symbol codes to link to the product',
                        },
                        {
                            displayName: 'Store ID',
                            name: 'store_id',
                            type: 'number',
                            default: 0,
                            description: 'ID of the store',
                        },
                    ],
                },
            ],
        },
        {
            displayName: 'Media Gallery Entries',
            name: 'mediaGalleryEntries',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Media Gallery Entry',
            options: [
                {
                    displayName: 'Media Gallery Entry',
                    name: 'mediaGalleryEntry',
                    values: [
																	{
																		displayName: 'Content',
																		name: 'content',
																		type: 'fixedCollection',
																		default: {},
																		options: [
																			{
																				displayName: 'Content Details',
																				name: 'contentDetails',
																					values:	[
																							{
																								displayName: 'Content',
																								name: 'content',
																								type: 'string',
																								default: '',
																								description: 'Content of the media (base64, file path, or URL)',
																							},
																							{
																								displayName: 'Name',
																								name: 'name',
																								type: 'string',
																								default: '',
																								description: 'Name of the media file',
																							},
																						]
																			},
																			]
																	},
																	{
																		displayName: 'Disabled',
																		name: 'disabled',
																		type: 'boolean',
																		default: false,
																		description: 'Whether the media is disabled',
																	},
																	{
																		displayName: 'File',
																		name: 'file',
																		type: 'string',
																		default: '',
																		description: 'File name of the media',
																	},
																	{
																		displayName: 'Label',
																		name: 'label',
																		type: 'string',
																		default: '',
																		description: 'Label of the media',
																	},
																	{
																		displayName: 'Media Type',
																		name: 'media_type',
																		type: 'options',
																		options: [
																			{
																				name: 'Image',
																				value: 'image',
																			},
																			{
																				name: 'Video',
																				value: 'video',
																			},
																			],
																		default: 'image',
																		description: 'Type of the media',
																	},
																	{
																		displayName: 'Position',
																		name: 'position',
																		type: 'number',
																		default: 1,
																		description: 'Position of the media in the gallery',
																	},
																	{
																		displayName: 'Scope',
																		name: 'scope',
																		type: 'options',
																		options: [
																			{
																				name: 'Stores',
																				value: 'stores',
																			},
																			{
																				name: 'Websites',
																				value: 'websites',
																			},
																			],
																		default: 'stores',
																		description: 'Scope of the media',
																	},
																	{
																		displayName: 'Types',
																		name: 'types',
																		type: 'multiOptions',
																		options: [
																			{
																				name: 'Image',
																				value: 'image',
																			},
																			{
																				name: 'Small Image',
																				value: 'small_image',
																			},
																			{
																				name: 'Thumbnail',
																				value: 'thumbnail',
																			},
																			],
																		default: [],
																		description: 'Types of the media',
																	},
															],
                },
            ],
        },
        {
            displayName: 'Download Items',
            name: 'downloadItems',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Download Item',
            options: [
                {
                    displayName: 'Download Item',
                    name: 'downloadItem',
                    values: [
																	{
																		displayName: 'Content',
																		name: 'content',
																		type: 'string',
																		default: '',
																		description: 'Content of the download item (URL)',
																	},
																	{
																		displayName: 'External Category IDs',
																		name: 'external_category_ids',
																		type: 'string',
																		default: '',
																		description: 'External category IDs to link to the download item',
																	},
																	{
																		displayName: 'External Company IDs',
																		name: 'external_company_ids',
																		type: 'string',
																		default: '',
																		description: 'External company IDs to link to the download item',
																	},
																	{
																		displayName: 'External ID',
																		name: 'external_id',
																		type: 'string',
																		default: '',
																		description: 'External ID of the download item',
																	},
																	{
																		displayName: 'Filename',
																		name: 'filename',
																		type: 'string',
																		default: '',
																		description: 'Filename of the download item',
																	},
																	{
																		displayName: 'Product All',
																		name: 'product_all',
																		type: 'options',
																		options: [
																			{
																				name: 'Yes',
																				value: 1
																			},
																			{
																				name: 'No',
																				value: 0
																			},
																			],
																		default: 0,
																		description: 'Whether the download item is for all products',
																	},
																	{
																		displayName: 'Show in Portal',
																		name: 'show_in_portal',
																		type: 'options',
																		options: [
																			{
																				name: 'Yes',
																				value: 1
																			},
																			{
																				name: 'No',
																				value: 0
																			},
																			],
																		default: 0,
																		description: 'Whether to show the download item in the portal',
																	},
																	{
																		displayName: 'SKUs',
																		name: 'skus',
																		type: 'string',
																		default: '',
																		description: 'SKUs to link to the download item',
																	},
																	{
																		displayName: 'Status',
																		name: 'status',
																		type: 'options',
																		options: [
																			{
																				name: 'Enabled',
																				value: 1
																			},
																			{
																				name: 'Disabled',
																				value: 2
																			},
																			],
																		default: 1,
																		description: 'Status of the download item',
																	},
																	{
																		displayName: 'Store ID',
																		name: 'store_id',
																		type: 'number',
																		default: 1,
																		description: 'ID of the store',
																	},
																	{
																		displayName: 'Title',
																		name: 'title',
																		type: 'string',
																		default: '',
																		description: 'Title of the download item',
																	},
																	{
																		displayName: 'Visibility',
																		name: 'visibility',
																		type: 'options',
																		options: [
																			{
																				name: 'Enterprise Users (B2B)',
																				value: 1
																			},
																			{
																				name: 'Consumers	/	Anonymous Visitors (B2C)',
																				value: 2
																			},
																			{
																				name: 'No Restriction',
																				value: 3
																			},
																			{
																				name: 'Selected Companies',
																				value: 4
																			},
																			{
																				name: 'Selected Company Groups',
																				value: 5
																			},
																			{
																				name: 'Enterprise Users and Consumers (B2B	/	B2C)',
																				value: 6
																			},
																			],
																		default: 3,
																		description: 'Visibility of the download item',
																	},
															],
                },
            ],
        },
        {
            displayName: 'Product Links',
            name: 'productLinks',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Product Link',
            options: [
                {
                    displayName: 'Product Link',
                    name: 'productLink',
                    values: [
                        {
                            displayName: 'Linked Product SKU',
                            name: 'linked_product_sku',
                            type: 'string',
                            default: '',
                            description: 'SKU of the linked product',
                        },
                        {
                            displayName: 'Link Type Name or ID',
                            name: 'link_type',
                            type: 'options',
                            typeOptions: {
                                loadOptionsMethod: 'getProductLinkTypes',
                            },
                            description: 'Type of the product link. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
                            default: ''
                        },
                    ],
                },
            ],
        },
        {
            displayName: 'External Category Links',
            name: 'externalCategoryLinks',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add External Category Link',
            options: [
                {
                    displayName: 'External Category Link',
                    name: 'externalCategoryLink',
                    values: [
                        {
                            displayName: 'External Category ID',
                            name: 'external_category_id',
                            type: 'string',
                            default: '',
                            description: 'External ID of the category',
                        },
                    ],
                },
            ],
        }
    ];
}
