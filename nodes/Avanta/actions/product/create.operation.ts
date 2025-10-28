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
            const visibility = this.getNodeParameter('visibility', i, 4) as number;
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

            // Handle product symbols (supports UI collection or raw JSON)
            if (additionalFields.productSymbols) {
                const symbolConfig = additionalFields.productSymbols as IDataObject;
                let symbols: ProductSymbol[] = [];

                if (symbolConfig.inputMode === 'json' && symbolConfig.productSymbolsJson) {
                    try {
                        const parsed = JSON.parse(symbolConfig.productSymbolsJson as string);
                        if (Array.isArray(parsed)) {
                            symbols = parsed.map((symbol: any): ProductSymbol => ({
                                extension_attributes: {
                                    sku: symbol.sku || '',
                                    symbol_codes: symbol.symbol_codes || [],
                                },
                                store_id: Number(symbol.store_id ?? 0),
                            }));
                        } else {
                            throw new Error('Product Symbols JSON must be an array');
                        }
                    } catch (err) {
                        throw new Error(`Invalid JSON in Product Symbols: ${(err as Error).message}`);
                    }
                } else if (symbolConfig.productSymbol) {
                    const collection = symbolConfig.productSymbol as IDataObject[];
                    symbols = collection.map((symbol: any): ProductSymbol => ({
                        extension_attributes: {
                            sku: symbol.sku || '',
                            symbol_codes: (symbol.symbol_codes || '')
                                .split(',')
                                .map((code: string) => code.trim())
                                .filter((code: string) => code !== ''),
                        },
                        store_id: Number(symbol.store_id ?? 0),
                    }));
                }

                if (symbols.length > 0) {
                    productData.product.product_symbols = symbols;
                }
            }

            /// Handle media gallery entries (supports UI collection or raw JSON)
            if (additionalFields.mediaGalleryEntries) {
                const mediaConfig = additionalFields.mediaGalleryEntries as IDataObject;
                let entries: MediaGalleryEntry[] = [];

                if (mediaConfig.inputMode === 'json' && mediaConfig.mediaGalleryJson) {
                    try {
                        const parsed = JSON.parse(mediaConfig.mediaGalleryJson as string);
                        if (Array.isArray(parsed)) {
                            entries = parsed.map((entry: any) => ({
                                media_type: entry.media_type || 'image',
                                label: entry.label || '',
                                position: Number(entry.position ?? 1),
                                disabled: Boolean(entry.disabled ?? false),
                                file: entry.file || '',
                                scope: entry.scope || 'stores',
                                types: entry.types || ['image', 'small_image', 'thumbnail'],
                                content: entry.content
                                    ? {
                                        content: entry.content.content || '',
                                        name: entry.content.name || '',
                                    }
                                    : undefined,
                            }));
                        } else {
                            throw new Error('Media Gallery JSON must be an array');
                        }
                    } catch (err) {
                        throw new Error(`Invalid JSON in Media Gallery Entries: ${(err as Error).message}`);
                    }
                } else if (mediaConfig.mediaGalleryEntry) {
                    const collection = mediaConfig.mediaGalleryEntry as IDataObject[];
                    entries = collection.map((entry: any): MediaGalleryEntry => ({
                        media_type: entry.media_type || 'image',
                        label: entry.label || '',
                        position: Number(entry.position ?? 1),
                        disabled: Boolean(entry.disabled ?? false),
                        file: entry.file || '',
                        scope: entry.scope || 'stores',
                        types: entry.types || ['image', 'small_image', 'thumbnail'],
                        content: entry.content?.contentDetails
                            ? {
                                content: entry.content.contentDetails.content || '',
                                name: entry.content.contentDetails.name || '',
                            }
                            : undefined,
                    }));
                }

                if (entries.length > 0) {
                    productData.product.dynamic_media_gallery_entries = entries;
                }
            }

            // Handle download items (supports UI collection or raw JSON)
            if (additionalFields.downloadItems) {
                const downloadConfig = additionalFields.downloadItems as IDataObject;
                let collection: DownloadItem[] = [];

                if (downloadConfig.inputMode === 'json' && downloadConfig.downloadItemsJson) {
                    try {
                        const parsed = JSON.parse(downloadConfig.downloadItemsJson as string);
                        if (Array.isArray(parsed)) {
                            collection = parsed.map((item: any) => ({
                                status: Number(item.status ?? 1),
                                show_in_portal: Number(item.show_in_portal ?? 0),
                                title: item.title || '',
                                external_id: item.external_id || '',
                                visibility: Number(item.visibility ?? 3),
                                product_all: Number(item.product_all ?? 0),
                                filename: item.filename || '',
                                extension_attributes: {
                                    content: item.extension_attributes?.content || '',
                                    store_id: Number(item.extension_attributes?.store_id ?? 1),
                                    external_category_ids:
                                        item.extension_attributes?.external_category_ids || [],
                                    external_company_ids:
                                        item.extension_attributes?.external_company_ids || [],
                                    skus: item.extension_attributes?.skus || [],
                                },
                            }));
                        } else {
                            throw new Error('Download Items JSON must be an array');
                        }
                    } catch (err) {
                        throw new Error(`Invalid JSON in Download Items: ${(err as Error).message}`);
                    }
                } else if (downloadConfig.downloadItem) {
                    const collectionItems = downloadConfig.downloadItem as IDataObject[];
                    collection = collectionItems.map((item: any): DownloadItem => ({
                        status: Number(item.status ?? 1),
                        show_in_portal: item.show_in_portal ? 1 : 0,
                        title: item.title || '',
                        external_id: item.external_id || '',
                        visibility: Number(item.visibility ?? 3),
                        product_all: item.product_all ? 1 : 0,
                        filename: item.filename || '',
                        extension_attributes: {
                            content: item.content || '',
                            store_id: Number(item.store_id ?? 1),
                            external_category_ids: (item.external_category_ids || '')
                                .split(',')
                                .map((v: string) => v.trim())
                                .filter((v: string) => v !== ''),
                            external_company_ids: (item.external_company_ids || '')
                                .split(',')
                                .map((v: string) => v.trim())
                                .filter((v: string) => v !== ''),
                            skus: (item.skus || '')
                                .split(',')
                                .map((v: string) => v.trim())
                                .filter((v: string) => v !== ''),
                        },
                    }));
                }

                if (collection.length > 0) {
                    productData.product.download_items = collection;
                }
            }

            // Handle product links if provided
            if (additionalFields.productLinks) {
                let collection = ((additionalFields.productLinks as IDataObject).productLink as IDataObject[]);
                const productLinks: ProductLink[] = [];
                for (const link of collection) {
                    // Ensure linked_product_sku and link_type are strings
                    const linkedProductSku = String(link.linked_product_sku || '');
                    const linkType = String(link.link_type || '');
                    if (linkedProductSku && linkType) {
                        if (linkedProductSku.includes(',')) {
                            // Handle comma-separated linked product SKUs
                            const linkedSkus = linkedProductSku
                                .split(',')
                                .map((sku: string) => sku.trim())
                                .filter((sku: string) => sku !== '');
                            linkedSkus.forEach((linkedSku: string) => {
                                productLinks.push({
                                    sku,
                                    linked_product_sku: linkedSku,
                                    link_type: linkType
                                });
                            });
                        } else {
                            // Handle single linked product SKU
                            productLinks.push({
                                sku,
                                linked_product_sku: linkedProductSku,
                                link_type: linkType
                            });
                        }
                    }
                }
                productData.product.product_links = productLinks;
            }

            // Handle external category links if provided
            if (additionalFields.externalCategoryLinks) {
                if (!productData.product.extension_attributes) {
                    productData.product.extension_attributes = {};
                }
                let collection = ((additionalFields.externalCategoryLinks as IDataObject).externalCategoryLink as IDataObject[]);
                const externalCategoryLinks: { external_category_id: string }[] = [];
                for (const link of collection) {
                    if (typeof link.external_category_id === 'string') {
                        if (link.external_category_id.includes(',')) {
                            // Handle comma-separated category IDs
                            const categoryIds = link.external_category_id
                                .split(',')
                                .map((id: string) => id.trim())
                                .filter((id: string) => id !== '');
                            categoryIds.forEach((id: string) => {
                                externalCategoryLinks.push({
                                    external_category_id: id
                                });
                            });
                        } else {
                            // Handle single category ID
                            externalCategoryLinks.push({
                                external_category_id: link.external_category_id
                            });
                        }
                    }
                }
                productData.product.extension_attributes.external_category_links = externalCategoryLinks;
            }

            // Handle stock information if provided
            if (additionalFields.stockItem) {
                const stockItem = additionalFields.stockItem as IDataObject;

                // Nur definierte Werte in ein sauberes Objekt übernehmen
                const cleanedStockItem: Record<string, any> = {};
                for (const [key, value] of Object.entries(stockItem)) {
                    if (value !== undefined && value !== null && value !== '') {
                        if (typeof value === 'string' && !isNaN(Number(value))) {
                            cleanedStockItem[key] = Number(value);
                        } else if (value === 'true' || value === 'false') {
                            cleanedStockItem[key] = value === 'true';
                        } else {
                            cleanedStockItem[key] = value;
                        }
                    }
                }

                if (Object.keys(cleanedStockItem).length > 0) {
                    productData.product.extension_attributes = productData.product.extension_attributes || {};
                    productData.product.extension_attributes.stock_item = cleanedStockItem;
                }
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
            type: 'collection',
            default: {},
            placeholder: 'Add Product Symbols',
            description: 'Links this product with related symbol codes. Symbols can be added manually or provided as a JSON array.',
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
                    description: 'Choose whether to provide product symbols via the UI or as JSON',
                },
                {
                    displayName: 'Product Symbol Collection',
                    name: 'productSymbol',
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
                                    description: 'SKU of the product this symbol belongs to',
                                },
                                {
                                    displayName: 'Store ID',
                                    name: 'store_id',
                                    type: 'number',
                                    default: 0,
                                    description: 'Magento store ID where the symbol applies',
                                },
                                {
                                    displayName: 'Symbol Codes (Comma Separated)',
                                    name: 'symbol_codes',
                                    type: 'string',
                                    default: '',
                                    description: 'Comma-separated list of symbol codes to link with the product',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Product Symbols JSON',
                    name: 'productSymbolsJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '[]',
                    description:
                        'Provide product symbols as JSON. Example:<br>' +
                        '<pre>[<br>' +
                        '{<br>' +
                        '  "sku": "P12345",<br>' +
                        '  "store_id": 1,<br>' +
                        '  "symbol_codes": ["CE", "ISO9001"]<br>' +
                        '},<br>' +
                        '{<br>' +
                        '  "sku": "P12346",<br>' +
                        '  "store_id": 2,<br>' +
                        '  "symbol_codes": ["UL"]<br>' +
                        '}<br>' +
                        ']</pre>',
                },
            ],
        },
        {
            displayName: 'Media Gallery Entries',
            name: 'mediaGalleryEntries',
            type: 'collection',
            default: {},
            placeholder: 'Add Media Gallery Entries',
            description: 'Product media images or videos. You can add them manually or provide a JSON array.',
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
                    description: 'Choose whether to provide media entries via the UI or as JSON',
                },
                {
                    displayName: 'Media Gallery Entry Collection',
                    name: 'mediaGalleryEntry',
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
                                            values: [
                                                {
                                                    displayName: 'Content',
                                                    name: 'content',
                                                    type: 'string',
                                                    default: '',
                                                    description:
                                                        'Media content as base64, a local path, or a public URL',
                                                },
                                                {
                                                    displayName: 'Name',
                                                    name: 'name',
                                                    type: 'string',
                                                    default: '',
                                                    description: 'Name of the media file',
                                                },
                                            ],
                                        },
                                    ],
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
                                    description: 'Relative file path in Magento (e.g., "/f/r/front.jpg")',
                                },
                                {
                                    displayName: 'Label',
                                    name: 'label',
                                    type: 'string',
                                    default: '',
                                    description: 'Label or title of the image',
                                },
                                {
                                    displayName: 'Media Type',
                                    name: 'media_type',
                                    type: 'options',
                                    options: [
                                        { name: 'Image', value: 'image' },
                                        { name: 'Video', value: 'video' },
                                    ],
                                    default: 'image',
                                    description: 'Type of media',
                                },
                                {
                                    displayName: 'Position',
                                    name: 'position',
                                    type: 'number',
                                    default: 1,
                                    description: 'Order position of the media in the gallery',
                                },
                                {
                                    displayName: 'Scope',
                                    name: 'scope',
                                    type: 'options',
                                    options: [
                                        { name: 'Stores', value: 'stores' },
                                        { name: 'Websites', value: 'websites' },
                                    ],
                                    default: 'stores',
                                    description: 'Scope where the media applies',
                                },
                                {
                                    displayName: 'Types',
                                    name: 'types',
                                    type: 'multiOptions',
                                    options: [
                                        { name: 'Image', value: 'image' },
                                        { name: 'Small Image', value: 'small_image' },
                                        { name: 'Thumbnail', value: 'thumbnail' },
                                    ],
                                    default: [],
                                    description: 'Defines how this media is used (e.g., main, thumbnail)',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Media Gallery JSON',
                    name: 'mediaGalleryJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '[]',
                    description:
                        'Provide media entries as JSON. Example:<br>' +
                        '<pre>[<br>' +
                        '{<br>' +
                        '  "media_type": "image",<br>' +
                        '  "label": "Front View",<br>' +
                        '  "position": 1,<br>' +
                        '  "disabled": false,<br>' +
                        '  "file": "/f/r/front.jpg",<br>' +
                        '  "types": ["image","small_image","thumbnail"],<br>' +
                        '  "content": { "content": "https://example.com/front.jpg", "name": "front.jpg" }<br>' +
                        '},<br>' +
                        '{<br>' +
                        '  "media_type": "image",<br>' +
                        '  "label": "Back View",<br>' +
                        '  "position": 2,<br>' +
                        '  "file": "/f/r/back.jpg"<br>' +
                        '}<br>' +
                        ']</pre>',
                },
            ],
        },
        {
            displayName: 'Download Items',
            name: 'downloadItems',
            type: 'collection',
            default: {},
            placeholder: 'Add Download Items',
            description: 'Files that can be downloaded for this product. You can add them manually or provide a JSON array.',
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
                    description: 'Choose whether to provide download items via the UI or as JSON',
                },
                {
                    displayName: 'Download Item Collection',
                    name: 'downloadItem',
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
                    placeholder: 'Add Download Item',
                    options: [
                        {
                            displayName: 'Download Item',
                            name: 'downloadItem',
                            values: [
                                {
                                    displayName: 'Content (URL or Base64)',
                                    name: 'content',
                                    type: 'string',
                                    default: '',
                                    description: 'The downloadable file content or URL',
                                },
                                {
                                    displayName: 'External Category IDs (Comma Separated)',
                                    name: 'external_category_ids',
                                    type: 'string',
                                    default: '',
                                    description: 'Comma-separated list of external category IDs',
                                },
                                {
                                    displayName: 'External Company IDs (Comma Separated)',
                                    name: 'external_company_ids',
                                    type: 'string',
                                    default: '',
                                    description: 'Comma-separated list of external company IDs',
                                },
                                {
                                    displayName: 'External ID',
                                    name: 'external_id',
                                    type: 'string',
                                    default: '',
                                    description: 'External reference ID for this download item',
                                },
                                {
                                    displayName: 'Filename',
                                    name: 'filename',
                                    type: 'string',
                                    default: '',
                                    description: 'The name of the file (e.g., "manual.pdf")',
                                },
                                {
                                    displayName: 'For All Products',
                                    name: 'product_all',
                                    type: 'boolean',
                                    default: false,
                                    description: 'Whether this download applies to all products',
                                },
                                {
                                    displayName: 'Show In Portal',
                                    name: 'show_in_portal',
                                    type: 'boolean',
                                    default: false,
                                    description: 'Whether this item is visible in the customer portal',
                                },
                                {
                                    displayName: 'SKUs (Comma Separated)',
                                    name: 'skus',
                                    type: 'string',
                                    default: '',
                                    description: 'Comma-separated list of SKUs this item belongs to',
                                },
                                {
                                    displayName: 'Status',
                                    name: 'status',
                                    type: 'options',
                                    options: [
                                        { name: 'Enabled', value: 1 },
                                        { name: 'Disabled', value: 2 },
                                    ],
                                    default: 1,
                                    description: 'Current status of the download item',
                                },
                                {
                                    displayName: 'Store ID',
                                    name: 'store_id',
                                    type: 'number',
                                    default: 1,
                                    description: 'Magento store ID',
                                },
                                {
                                    displayName: 'Title',
                                    name: 'title',
                                    type: 'string',
                                    default: '',
                                    description: 'The title or display name for the download item',
                                },
                                {
                                    displayName: 'Visibility',
                                    name: 'visibility',
                                    type: 'options',
                                    options: [
                                        { name: 'Enterprise Users (B2B)', value: 1 },
                                        { name: 'Consumers (B2C)', value: 2 },
                                        { name: 'No Restriction', value: 3 },
                                        { name: 'Selected Companies', value: 4 },
                                        { name: 'Selected Company Groups', value: 5 },
                                        { name: 'Enterprise & Consumers (B2B/B2C)', value: 6 },
                                    ],
                                    default: 3,
                                    description: 'Visibility level of the download item',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Download Items JSON',
                    name: 'downloadItemsJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '[]',
                    description:
                        'Provide download items as JSON. Example:<br>' +
                        '<pre>[<br>' +
                        '{<br>' +
                        '  "title": "Manual",<br>' +
                        '  "filename": "manual.pdf",<br>' +
                        '  "status": 1,<br>' +
                        '  "store_id": 1,<br>' +
                        '  "extension_attributes": { "content": "https://example.com/manual.pdf" }<br>' +
                        '},<br>' +
                        '{<br>' +
                        '  "title": "Specs",<br>' +
                        '  "filename": "specs.pdf",<br>' +
                        '  "product_all": true<br>' +
                        '}<br>' +
                        ']</pre>',
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
                            description: 'SKU of the linked product, or a comma-separated list of SKUs (e.g., "sku1,sku2,sku3")',
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
                            description: 'External ID of the category, or a comma-separated list of IDs (e.g., "cat1,cat2,cat3")',
                        },
                    ],
                },
            ],
        },
        {
            displayName: 'Stock Information',
            name: 'stockItem',
            type: 'collection',
            default: {},
            placeholder: 'Add Stock Information',
            description:
                'Inventory management settings for this product. Only filled fields are sent to Magento.',
            options: [
                {
                    displayName: 'Backorders',
                    name: 'backorders',
                    type: 'options',
                    options: [
                        { name: 'No Backorders', value: 0 },
                        { name: 'Allow Qty Below 0', value: 1 },
                        { name: 'Allow Qty Below 0 + Notify Customer', value: 2 },
                    ],
                    default: 0,
                },
                {
                    displayName: 'Enable Qty Increments',
                    name: 'enable_qty_increments',
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Is In Stock',
                    name: 'is_in_stock',
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Is Qty Decimal',
                    name: 'is_qty_decimal',
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Manage Stock',
                    name: 'manage_stock',
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Max Sale Qty',
                    name: 'max_sale_qty',
                    type: 'number',
                    default: 9999,
                },
                {
                    displayName: 'Min Qty',
                    name: 'min_qty',
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Min Sale Qty',
                    name: 'min_sale_qty',
                    type: 'number',
                    default: 1,
                },
                {
                    displayName: 'Notify Stock Qty',
                    name: 'notify_stock_qty',
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Qty Increments',
                    name: 'qty_increments',
                    type: 'number',
                    default: 1,
                },
                {
                    displayName: 'Quantity',
                    name: 'qty',
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Use Config Backorders',
                    name: 'use_config_backorders',
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Use Config Manage Stock',
                    name: 'use_config_manage_stock',
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Use Config Min Qty',
                    name: 'use_config_min_qty',
                    type: 'boolean',
                    default: true,
                },
            ],
        },
    ];
}