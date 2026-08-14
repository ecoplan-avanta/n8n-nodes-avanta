import type { IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { createApiRequest, magentoApiRequest } from '../../../transport';
import { prepareErrorData, validateJSON } from '../../../helpers/utils';

const properties: INodeProperties[] = [
  {
    displayName: 'External ID',
    name: 'externalId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
  },
  {
    displayName: 'Status',
    name: 'status',
    type: 'number',
    default: 1,
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
  },
  {
    displayName: 'Drawing',
    name: 'drawing',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
    description: 'Path or identifier to the drawing (stored as string)'
  },
  {
    displayName: 'Hotspots (JSON)',
    name: 'hotspots',
    type: 'string',
    default: '',
    typeOptions: { rows: 6 },
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
    description: 'JSON string of hotspots; must be valid JSON if provided'
  },
  {
    displayName: 'Produkt Sku',
    name: 'productSku',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
  },
  {
    displayName: 'Produkt Website ID',
    name: 'productWebsiteId',
    type: 'number',
    required: true,
    default: 0,
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
  },
  {
    displayName: 'Items',
    name: 'items',
    type: 'fixedCollection',
    typeOptions: { multipleValues: false },
    default: {},
    displayOptions: { show: { resource: ['bom'], operation: ['importBom'] } },
    options: [
      {
        name: 'items',
        displayName: 'Items',
        values: [
          {
            displayName: 'Select Inputmode',
            name: 'itemsInputMode',
            type: 'options',
            options: [
              { name: 'Collection', value: 'collection' },
              { name: 'Raw JSON', value: 'json' },
            ],
            default: 'collection',
          },
          {
            displayName: 'Items',
            name: 'itemsCollection',
            type: 'fixedCollection',
            typeOptions: { multipleValues: true },
            default: {},
            displayOptions: { show: { itemsInputMode: ['collection'] } },
            options: [
              {
                name: 'item',
                displayName: 'Item',
                values: [
                  { displayName: 'Position Number', name: 'positionNumber', type: 'string', required: true, default: '' },
                  { displayName: 'SKU', name: 'sku', type: 'string', required: true, default: '' },
                  { displayName: 'Qty', name: 'qty', type: 'number', required: true, default: 1 },
                  { displayName: 'Unit', name: 'unit', type: 'string', required: true, default: 'Stk' },
                ],
              },
            ],
          },
          {
            displayName: 'Items (JSON)',
            name: 'itemsJson',
            type: 'string',
            typeOptions: { rows: 6 },
            default: '',
            displayOptions: { show: { itemsInputMode: ['json'] } },
            description: 'Provide an array: [{"positionNumber":"10","sku":"874542","qty":5,"unit":"Stk"}]',
          },
        ],
      },
    ],
  },
];

const displayOptions = {
  show: {
    resource: ['bom'],
    operation: ['importBom'],
  },
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];
  const bulk = this.getNodeParameter('bulk', 0, true) as boolean;
  const bulkPayloads: any[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const externalId = this.getNodeParameter('externalId', i) as string;
      const status = this.getNodeParameter('status', i) as number;
      const drawing = this.getNodeParameter('drawing', i, '') as string;
      const hotspotsStr = this.getNodeParameter('hotspots', i, '') as string;
      if (hotspotsStr) {
        const parsedHs = validateJSON(hotspotsStr);
        if (!parsedHs) throw new Error('Hotspots (JSON) must be valid JSON');
      }

      const sku = this.getNodeParameter('productSku', i) as string;
      const websiteId = this.getNodeParameter('productWebsiteId', i) as number;
      if (!sku && sku !== '') {
      }
      const product = { sku, website_id: websiteId } as any;

      const itemsFC = this.getNodeParameter('items', i, {}) as { items?: any };

      let itemsEntry: any = {};
      if (itemsFC && (itemsFC as any).items !== undefined) {
        const raw = (itemsFC as any).items;
        itemsEntry = Array.isArray(raw) ? (raw[0] ?? {}) : (raw || {});
      }
      const itemsInputMode = (itemsEntry.itemsInputMode || 'collection') as string;
      let bomItems: any[] = [];
      if (itemsInputMode === 'json') {
        const itemsJson = (itemsEntry.itemsJson || '') as string;
        const parsed = validateJSON(itemsJson);
        if (!parsed || !Array.isArray(parsed)) throw new Error('Items (JSON) must be a valid JSON array');

        bomItems = parsed.map((it: any) => ({
          position_number: it.position_number ?? it.positionNumber,
          sku: it.sku,
          qty: typeof it.qty === 'string' ? parseFloat(it.qty) : it.qty,
          unit: it.unit,
        }));
      } else {
        const coll = (itemsEntry.itemsCollection || {}) as { item?: any[] };
        bomItems = (coll.item || []).map((it: any) => ({
          position_number: it.positionNumber,
          sku: it.sku,
          qty: typeof it.qty === 'string' ? parseFloat(it.qty) : it.qty,
          unit: it.unit,
        }));
      }

      if (!bomItems || bomItems.length === 0) {
        throw new Error('Items are required: provide at least one item (via Collection or Items JSON)');
      }

      const payload: any = {
        bomData: {
          externalId,
          status,
          product,
          items: bomItems,
        },
      };
      if (drawing !== '') payload.bomData.drawing = drawing;
      if (hotspotsStr !== '') payload.bomData.hotspots = hotspotsStr;

      if (bulk) {
        bulkPayloads.push(payload);
      } else {
        const res = await magentoApiRequest.call(this, 'POST', '/V1/ecoplan-bom/import', payload);
        returnData.push(
          ...this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray([res]),
            { itemData: { item: i } },
          ),
        );
      }
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, i));
        continue;
      }
      throw new NodeApiError(this.getNode(), error as JsonObject);
    }
  }

  if (bulk && bulkPayloads.length > 0) {
    try {
      // async=true prepends /async/bulk
      const exec = await createApiRequest.call(this, bulkPayloads, '/V1/ecoplan-bom/import', true, 0);
      returnData.push(...exec);
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
