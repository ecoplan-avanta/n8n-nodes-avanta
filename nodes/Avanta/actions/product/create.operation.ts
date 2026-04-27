import {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { formatExtensionAttributes, prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';
import type {
    Product,
    DynamicCustomAttribute,
    ProductSymbol,
    MediaGalleryEntry,
    DownloadItem,
    ProductLink
} from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Ignore Hashing',
        name: 'ignoreHashing',
        type: 'boolean',
        default: false,
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        description: 'Skip product hashing checks in the backend and force save/update',
    },
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

            // Map optional weight from Additional Fields if provided
            if (additionalFields && (additionalFields as IDataObject).weight !== undefined &&
                (additionalFields as IDataObject).weight !== null &&
                (additionalFields as IDataObject).weight !== '') {
                const w = Number((additionalFields as IDataObject).weight as any);
                if (!Number.isNaN(w)) {
                    product.weight = w;
                }
            }

            const productData = {
                product
            };

            // Pass through repository flag to ignore hashing if requested (top-level toggle preferred)
            const ignoreHashingTopLevel = this.getNodeParameter('ignoreHashing', i, undefined) as boolean | undefined;
            if (ignoreHashingTopLevel === true) {
                (productData as IDataObject).ignoreHashing = true;
            } else if ((additionalFields as IDataObject) && (additionalFields as IDataObject).ignoreHashing === true) {
                // Fallback: support legacy placement under Additional Fields if present
                (productData as IDataObject).ignoreHashing = true;
            }

            // Handle custom attributes
            if (additionalFields.customAttributes) {
                let collection = ((additionalFields.customAttributes as IDataObject).customAttribute as IDataObject[]);
                productData.product.dynamic_custom_attributes = collection.map((attr: any) => {
                    return {
                        attribute_code: attr.attribute_code,
                        value: attr.value
                    };
                });
            }

            // Handle dynamic custom attributes if provided (collection or JSON)
            if (additionalFields.dynamicCustomAttributes) {
                const dyn = additionalFields.dynamicCustomAttributes as IDataObject;

                // JSON mode
                if (dyn.inputMode === 'json' && dyn.dynamicCustomAttributesJson) {
                    try {
                        const parsed = JSON.parse(dyn.dynamicCustomAttributesJson as string);
                        if (Array.isArray(parsed)) {
                            productData.product.dynamic_custom_attributes = parsed.map((attr: any) => ({
                                attribute_code: attr.attribute_code,
                                value: attr.value,
                            }));
                        } else {
                            throw new Error('Dynamic Custom Attributes JSON must be an array');
                        }
                    } catch (err) {
                        throw new Error(`Invalid JSON in Dynamic Custom Attributes: ${(err as Error).message}`);
                    }
                }

                // UI Collection mode
                else if (dyn.dynamicCustomAttribute) {
                    const wrapper = dyn.dynamicCustomAttribute as Record<string, any>;
                    const attributeSource = wrapper.dynamicCustomAttribute;

                    if (Array.isArray(attributeSource)) {
                        productData.product.dynamic_custom_attributes = attributeSource.map((attr: any): DynamicCustomAttribute => {
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
                }
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
                                type: item.type || '',
                                url: item.url || '',
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
                    const collectionItems = (downloadConfig.downloadItem as any).downloadItem as IDataObject[];
                    if (Array.isArray(collectionItems)) {
                        collection = collectionItems.map((item: any): DownloadItem => ({
                            status: Number(item.status ?? 1),
                            show_in_portal: item.show_in_portal ? 1 : 0,
                            title: item.title || '',
                            external_id: item.external_id || '',
                            visibility: Number(item.visibility ?? 3),
                            product_all: item.product_all ? 1 : 0,
                            filename: item.filename || '',
                            type: item.type || '',
                            url: item.url || '',
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
                }

                if (collection.length > 0) {
                    productData.product.download_items = collection;
                }
            }

            // Handle product links if provided (collection or JSON)
            if (additionalFields.productLinks) {
                const pl = additionalFields.productLinks as IDataObject;
                const productLinks: ProductLink[] = [];

                // JSON mode
                if (pl.inputMode === 'json' && pl.productLinksJson) {
                    try {
                        const parsed = JSON.parse(pl.productLinksJson as string);
                        if (Array.isArray(parsed)) {
                            for (const entry of parsed as any[]) {
                                if (!entry) continue;
                                const linkType = String(entry.link_type || '');
                                let linked = entry.linked_product_sku;

                                const pushLink = (linkedSku: string) => {
                                    if (!linkedSku || !linkType) return;
                                    productLinks.push({
                                        sku,
                                        linked_product_sku: String(linkedSku),
                                        link_type: linkType,
                                    });
                                };

                                if (Array.isArray(linked)) {
                                    (linked as any[])
                                        .map(v => String(v).trim())
                                        .filter(v => v !== '')
                                        .forEach(pushLink);
                                } else if (typeof linked === 'string') {
                                    const s = String(linked);
                                    if (s.includes(',')) {
                                        s.split(',')
                                            .map(v => v.trim())
                                            .filter(v => v !== '')
                                            .forEach(pushLink);
                                    } else {
                                        pushLink(s);
                                    }
                                }
                            }
                        } else {
                            throw new Error('Product Links JSON must be an array');
                        }
                    } catch (err) {
                        throw new Error(`Invalid JSON in Product Links: ${(err as Error).message}`);
                    }
                }

                // UI Collection mode (backward compatible)
                else if (pl.productLink) {
                    const collection = pl.productLink as IDataObject[];
                    for (const link of collection) {
                        const linkedProductSku = String(link.linked_product_sku || '');
                        const linkType = String(link.link_type || '');
                        if (linkedProductSku && linkType) {
                            if (linkedProductSku.includes(',')) {
                                const linkedSkus = linkedProductSku
                                    .split(',')
                                    .map((s: string) => s.trim())
                                    .filter((s: string) => s !== '');
                                linkedSkus.forEach((linkedSku: string) => {
                                    productLinks.push({
                                        sku,
                                        linked_product_sku: linkedSku,
                                        link_type: linkType,
                                    });
                                });
                            } else {
                                productLinks.push({
                                    sku,
                                    linked_product_sku: linkedProductSku,
                                    link_type: linkType,
                                });
                            }
                        }
                    }
                }

                if (productLinks.length > 0) {
                    productData.product.product_links = productLinks;
                }
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

            // Handle website IDs
            if (additionalFields.websiteIds) {
                const entries = (additionalFields.websiteIds as IDataObject)
                    .websiteId as IDataObject[];

                if (!productData.product.extension_attributes) {
                    productData.product.extension_attributes = {};
                }

                let websiteIds: number[] = [];

                for (const entry of entries) {
                    // Dropdown ID
                    if (entry.website_id) {
                        const id = Number(entry.website_id);
                        if (!isNaN(id)) {
                            websiteIds.push(id);
                        }
                    }

                    // Comma-separated IDs
                    if (entry.website_ids_comma) {
                        const extra = String(entry.website_ids_comma)
                            .split(',')
                            .map(v => Number(v.trim()))
                            .filter(v => !isNaN(v));

                        websiteIds.push(...extra);
                    }
                }

                // Remove duplicates
                websiteIds = [...new Set(websiteIds)];

                if (websiteIds.length > 0) {
                    productData.product.extension_attributes.website_ids = websiteIds;
                }
            }

            // Handle stock information if provided
            if (additionalFields.stockItem) {
                const stockItem = additionalFields.stockItem as IDataObject;
                let cleanedStockItem: Record<string, any> = {};

                if (stockItem.inputMode === 'json' && stockItem.stockItemJson) {
                    try {
                        cleanedStockItem = JSON.parse(stockItem.stockItemJson as string);
                    } catch (err) {
                        throw new Error(`Invalid JSON in Stock Item: ${(err as Error).message}`);
                    }
                } else {
                    // Nur definierte Werte in ein sauberes Objekt übernehmen
                    for (const [key, value] of Object.entries(stockItem)) {
                        if (key === 'inputMode' || key === 'stockItemJson') continue;
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
            type: 'collection',
            default: {},
            placeholder: 'Add Dynamic Custom Attributes',
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
                    description: 'Choose whether to provide dynamic custom attributes via the UI or as JSON',
                },
                {
                    displayName: 'Dynamic Custom Attribute Collection',
                    name: 'dynamicCustomAttribute',
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
                    displayName: 'Dynamic Custom Attributes JSON',
                    name: 'dynamicCustomAttributesJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '[]',
                    description:
                        'Provide dynamic custom attributes as JSON. Example:<br>' +
                        '<pre>[<br>' +
                        '{ "attribute_code": "color", "value": "red" },<br>' +
                        '{ "attribute_code": "features", "value": [{"key": "EN", "value": "Hard"}] }<br>' +
                        ']</pre>',
                },
            ],
        },
        {
            displayName: 'Weight',
            name: 'weight',
            type: 'number',
            default: 0,
            description: 'Product weight'
        },
        {
            displayName: 'Website IDs',
            name: 'websiteIds',
            type: 'fixedCollection',
            typeOptions: {
                multipleValues: true,
            },
            default: {},
            placeholder: 'Add Website ID',
            options: [
                {
                    displayName: 'Website ID',
                    name: 'websiteId',
                    values: [
                        {
                            displayName: 'Website (Optional) ID Name or ID',
                            name: 'website_id',
                            type: 'options',
                            typeOptions: {
                                loadOptionsMethod: 'getWebsites',
                            },
                            default: '',
                            description: 'Select a Magento website. Optional — leave empty if you want to use a comma-separated ID list. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
                        },
                        {
                            displayName: 'Website IDs (Comma Separated)',
                            name: 'website_ids_comma',
                            type: 'string',
                            default: '',
                            description: 'Comma-separated list of website IDs (e.g. "1,2,3"). Supports expressions.',
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
                            // eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
                            values: [
                                {
                                    displayName: 'Type',
                                    name: 'type',
                                    type: 'options',
                                    options: [
                                        { name: 'URL', value: 'url' },
                                        { name: 'Other', value: 'other' },
                                    ],
                                    default: 'other',
                                    description: 'The type of the download item',
                                },
                                {
                                    displayName: 'Content (URL or Base64)',
                                    name: 'content',
                                    type: 'string',
                                    displayOptions: {
                                        show: {
                                            type: ['other'],
                                        },
                                    },
                                    default: '',
                                    description: 'The downloadable file content or URL',
                                },
                                {
                                    displayName: 'URL',
                                    name: 'url',
                                    type: 'string',
                                    displayOptions: {
                                        show: {
                                            type: ['url'],
                                        },
                                    },
                                    default: '',
                                    description: 'The URL for the download item (required if Type is URL)',
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
                                    displayOptions: {
                                        show: {
                                            type: ['other'],
                                        },
                                    },
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
                        'Provide download items as JSON. Default type is "other" (requires "content"). Use type "url" for direct links.<br>' +
                        '<pre>[<br>' +
                        '{<br>' +
                        '  "title": "Manual",<br>' +
                        '  "type": "other",<br>' +
                        '  "filename": "manual.pdf",<br>' +
                        '  "extension_attributes": { "content": "BASE64_OR_URL_TO_FILE" }<br>' +
                        '},<br>' +
                        '{<br>' +
                        '  "title": "External Link",<br>' +
                        '  "type": "url",<br>' +
                        '  "url": "https://example.com/manual.pdf"<br>' +
                        '}<br>' +
                        ']</pre>',
                },
            ],
        },
        {
            displayName: 'Product Links',
            name: 'productLinks',
            type: 'collection',
            default: {},
            placeholder: 'Add Product Links',
            description: 'Create links between this product and other products. You can add them manually or provide a JSON array.',
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
                    description: 'Choose whether to provide product links via the UI or as JSON',
                },
                {
                    displayName: 'Product Link Collection',
                    name: 'productLink',
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
                    displayName: 'Product Links JSON',
                    name: 'productLinksJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '[]',
                    description:
                        'Provide product links as JSON. Each item must include link_type and linked_product_sku (string, comma-separated string, or array). Example:<br>' +
                        '<pre>[<br>' +
                        '{ "link_type": "related", "linked_product_sku": "SKU-1" },<br>' +
                        '{ "link_type": "upsell", "linked_product_sku": ["SKU-2","SKU-3"] },<br>' +
                        '{ "link_type": "crosssell", "linked_product_sku": "SKU-4,SKU-5" }<br>' +
                        ']</pre>',
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
                    displayName: 'Input Mode',
                    name: 'inputMode',
                    type: 'options',
                    options: [
                        { name: 'UI Collection', value: 'collection' },
                        { name: 'Raw JSON', value: 'json' },
                    ],
                    default: 'collection',
                    description: 'Choose whether to provide stock information via the UI or as JSON',
                },
                {
                    displayName: 'Stock Item JSON',
                    name: 'stockItemJson',
                    type: 'json',
                    displayOptions: {
                        show: {
                            inputMode: ['json'],
                        },
                    },
                    default: '{}',
                    description: 'Provide stock information as JSON object',
                },
                {
                    displayName: 'Backorders',
                    name: 'backorders',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
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
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Is In Stock',
                    name: 'is_in_stock',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Is Qty Decimal',
                    name: 'is_qty_decimal',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Manage Stock',
                    name: 'manage_stock',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Max Sale Qty',
                    name: 'max_sale_qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 9999,
                },
                {
                    displayName: 'Min Qty',
                    name: 'min_qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Min Sale Qty',
                    name: 'min_sale_qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 1,
                },
                {
                    displayName: 'Notify Stock Qty',
                    name: 'notify_stock_qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Qty Increments',
                    name: 'qty_increments',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 1,
                },
                {
                    displayName: 'Quantity',
                    name: 'qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'number',
                    default: 0,
                },
                {
                    displayName: 'Use Config Backorders',
                    name: 'use_config_backorders',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Use Config Manage Stock',
                    name: 'use_config_manage_stock',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: true,
                },
                {
                    displayName: 'Use Config Min Qty',
                    name: 'use_config_min_qty',
                    displayOptions: {
                        show: {
                            inputMode: ['collection'],
                        },
                    },
                    type: 'boolean',
                    default: true,
                },
            ],
        },
    ];
}
